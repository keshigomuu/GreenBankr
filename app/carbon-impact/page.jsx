"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Leaf, TrendingDown, Calendar, Award } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useAuth } from "../../contexts/auth-context";
import { getTransactions, getTransactionCategories } from "@/lib/account-api";
import { findKey, parseAmount, formatDateTime } from "@/lib/utils";

export default function CarbonImpactPage() {
  const { getCustomerId, getDepositAccount } = useAuth();
  const customerId = getCustomerId();
  const accountId = getDepositAccount?.() || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carbon impact data
  const [totalCarbon, setTotalCarbon] = useState(0);
  const [monthlyCarbon, setMonthlyCarbon] = useState(0);
  const [carbonTrend, setCarbonTrend] = useState([]);
  const [categoryImpact, setCategoryImpact] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Load transaction data and calculate carbon impact
  useEffect(() => {
    if (!customerId || !accountId) return;

    const loadCarbonData = async () => {
      try {
        setLoading(true);
        setError("");

        // Get transactions
        const txns = await getTransactions(customerId);
        
        // Get categories from localStorage and server
        const categoryMap = JSON.parse(localStorage.getItem("txnCategories") || "{}");
        
        const ids = txns.map(tx => tx.transactionId).filter(Boolean);
        let serverCategories = {};
        try {
          serverCategories = await getTransactionCategories(ids);
        } catch (e) {
          console.warn("Failed to load server categories", e);
        }

        // Enhanced transactions with categories - EXCLUDE DONATIONS
        const enhancedTx = txns.map(tx => {
          const tid = tx.transactionId;
          const category = 
            tx.MerchantCategory || 
            tx.merchantCategory || 
            serverCategories[tid] || 
            categoryMap[tid] || 
            "Other";

          return {
            ...tx,
            MerchantCategory: category,
          };
        }).filter(tx => {
          // EXCLUDE DONATIONS - they have no carbon impact
          const category = tx.MerchantCategory || "Other";
          return category !== "Donation" && category !== "Deposit" && category !== "Withdrawal";
        });

        console.log("Transactions for carbon calculation (excluding donations):", enhancedTx.length);

        // Calculate carbon impact for each transaction
        const transactionsWithCarbon = enhancedTx.map(tx => {
          const amountKey = findKey(tx, ["transactionAmount", "txnAmt", "Amount", "TranAmount", "Amt"]);
          const amount = Math.abs(parseAmount(amountKey ? tx[amountKey] : 0));
          const category = tx.MerchantCategory || "Other";
          
          // Carbon impact factors (kg CO2 per dollar spent)
          const carbonFactors = {
            "Transport": 0.5,      // High impact
            "Food": 0.3,           // Medium-high impact
            "Groceries": 0.25,     // Medium impact
            "Shopping": 0.2,       // Medium impact
            "Entertainment": 0.15, // Lower impact
            "Other": 0.1,          // Low impact
            // Donations excluded - they don't contribute to personal carbon footprint
          };

          const carbonFactor = carbonFactors[category] || carbonFactors["Other"];
          const carbonImpact = amount * carbonFactor;

          return {
            ...tx,
            carbonImpact,
            amount,
          };
        });

        // Calculate total carbon impact
        const totalCarbonImpact = transactionsWithCarbon.reduce((sum, tx) => sum + tx.carbonImpact, 0);
        setTotalCarbon(totalCarbonImpact);

        // Calculate monthly carbon impact
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyTransactions = transactionsWithCarbon.filter(tx => {
          const dateKey = findKey(tx, ["transactionDate", "TranDate", "Date", "Time"]);
          if (!dateKey) return false;
          const txDate = new Date(tx[dateKey]);
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });
        const monthlyCarbonImpact = monthlyTransactions.reduce((sum, tx) => sum + tx.carbonImpact, 0);
        setMonthlyCarbon(monthlyCarbonImpact);

        // Generate monthly carbon trend
        const monthlyData = {};
        transactionsWithCarbon.forEach(tx => {
          const dateKey = findKey(tx, ["transactionDate", "TranDate", "Date", "Time"]);
          if (!dateKey) return;
          
          const txDate = new Date(tx[dateKey]);
          const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
          }
          monthlyData[monthKey] += tx.carbonImpact;
        });

        const trendData = Object.entries(monthlyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-6) // Last 6 months
          .map(([month, carbon]) => ({
            month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
            carbon: Number(carbon.toFixed(2)),
          }));

        setCarbonTrend(trendData);

        // Calculate carbon impact by category
        const categoryData = {};
        transactionsWithCarbon.forEach(tx => {
          const category = tx.MerchantCategory || "Other";
          if (!categoryData[category]) {
            categoryData[category] = 0;
          }
          categoryData[category] += tx.carbonImpact;
        });

        const categoryArray = Object.entries(categoryData)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5) // Top 5 categories
          .map(([category, carbon]) => ({
            category,
            carbon: Number(carbon.toFixed(2)),
          }));

        setCategoryImpact(categoryArray);

        // Set recent high-impact transactions
        const highImpactTransactions = transactionsWithCarbon
          .sort((a, b) => b.carbonImpact - a.carbonImpact)
          .slice(0, 5);

        setRecentTransactions(highImpactTransactions);

      } catch (err) {
        console.error("Error loading carbon data:", err);
        setError(err.message || "Failed to load carbon impact data");
      } finally {
        setLoading(false);
      }
    };

    loadCarbonData();
  }, [customerId, accountId]);

  // Chart colors
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-lg text-muted-foreground">Loading carbon impact data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Leaf className="w-8 h-8 text-green-600" />
              Carbon Impact Tracker
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and reduce your environmental footprint through spending habits
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Note: Donations are excluded from carbon calculations as they represent positive environmental action
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Carbon Impact
                </CardTitle>
                <Leaf className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalCarbon.toFixed(2)} kg CO₂
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lifetime total from spending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyCarbon.toFixed(2)} kg CO₂
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current month impact
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Impact Rating
                </CardTitle>
                <Award className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyCarbon < 10 ? "🌟 Excellent" : 
                   monthlyCarbon < 25 ? "🌿 Good" : 
                   monthlyCarbon < 50 ? "🟡 Fair" : "🔴 High"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on monthly impact
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carbon Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Carbon Impact Trend</CardTitle>
                <CardDescription>
                  Your monthly carbon footprint over time (excluding donations)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {carbonTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No carbon impact data available yet.
                  </p>
                ) : (
                  <ChartContainer
                    config={{
                      carbon: {
                        label: "Carbon (kg)",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={carbonTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="carbon"
                          stroke="var(--color-carbon)"
                          strokeWidth={2}
                          dot={{ fill: "var(--color-carbon)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Category Impact Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Impact by Category</CardTitle>
                <CardDescription>
                  Carbon footprint breakdown by spending category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryImpact.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No category data available yet.
                  </p>
                ) : (
                  <ChartContainer
                    config={{
                      carbon: {
                        label: "Carbon (kg)",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryImpact}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="carbon" radius={[8, 8, 0, 0]} fill="var(--color-carbon)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent High-Impact Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>High-Impact Transactions</CardTitle>
              <CardDescription>
                Recent transactions with significant carbon footprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No high-impact transactions found.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((tx, idx) => {
                    const dateKey = findKey(tx, ["transactionDate", "TranDate", "Date", "Time"]);
                    const dateStr = dateKey ? tx[dateKey] : null;
                    const dateLabel = formatDateTime(dateStr);

                    return (
                      <div
                        key={tx.transactionId || idx}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{tx.MerchantCategory}</p>
                          <p className="text-sm text-muted-foreground">{dateLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${tx.amount.toFixed(2)}</p>
                          <p className="text-sm text-orange-600">
                            {tx.carbonImpact.toFixed(2)} kg CO₂
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
}