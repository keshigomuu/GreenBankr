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
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  DollarSign,
  Gift,
} from "lucide-react";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuth } from "@/contexts/auth-context";
import {
  getDepositBalance,
  getTransactionHistory,
  getTransactionCategories,
} from "@/lib/account-api";
import { getCarbonImpact } from "@/lib/impact-api";
import { useLoyaltyPoints } from "@/hooks/useLoyalty";
import { useMyClaims } from "@/hooks/useRewards";
import { formatSGT } from "@/lib/formatSGT";

/**
 * Helper to find a key in an object whose name matches any of the
 * provided regex patterns (case-insensitive).
 */
function findKey(obj, regexes) {
  const keys = Object.keys(obj || {});
  for (const re of regexes) {
    const regex = new RegExp(re, "i");
    const match = keys.find((k) => regex.test(k));
    if (match) return match;
  }
  return null;
}

/**
 * Helper to safely parse a numeric amount (strip $ and commas).
 */
function parseAmount(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value);
  const cleaned = str.replace(/[^0-9.\-]/g, "");
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// Add this helper function near the top, after your existing helper functions
function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  // Use ISO date (YYYY-MM-DD) so SSR and client match
  return d.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { user, getCustomerId, getDepositAccount } = useAuth();

  const customerId = getCustomerId();
  const accountId = getDepositAccount?.();

  const [balance, setBalance] = useState(null);
  const [balanceChangePct, setBalanceChangePct] = useState(0);

  const [carbonThisMonth, setCarbonThisMonth] = useState(0);
  const [carbonChangePct, setCarbonChangePct] = useState(0);
  const [carbonTrend, setCarbonTrend] = useState([]);

  const [spendingByCategory, setSpendingByCategory] = useState([]);
  const [error, setError] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});

  const [loading, setLoading] = useState(true);

  // Use the same loyalty data source as rewards page
  const {
    points: donatedPoints, // lifetime donated points
    loading: pointsLoading,
    error: pointsError,
  } = useLoyaltyPoints(customerId);

  const { claims } = useMyClaims(customerId);

  // Calculate current points the same way as rewards page
  const totalSpent = Array.isArray(claims)
    ? claims.reduce((s, c) => s + Number(c.pointsCost || 0), 0)
    : 0;

  const loyaltyPoints = Math.max((donatedPoints ?? 0) - totalSpent, 0);

  // Load saved category map from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("txnCategories");
      if (saved) {
        setCategoryMap(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to parse txnCategories from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (!customerId || !accountId) {
      setLoading(false);
      setError("Please log in to view your dashboard.");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔍 Starting optimized dashboard load...");

        // OPTIMIZATION 1: Load balance first (most critical)
        console.log("📊 Loading balance...");
        const bal = await getDepositBalance(customerId, accountId);
        setBalance(Number(bal) || 0);
        setBalanceChangePct(12.5);

        // OPTIMIZATION 2: Load recent transactions only (last 30 days)
        console.log("💳 Loading recent transactions...");
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30); // Reduced from 3 months to 30 days

        const startDate = start.toISOString().slice(0, 10);
        const endDate = end.toISOString().slice(0, 10);

        const txns = await getTransactionHistory(accountId, startDate, endDate);

        // OPTIMIZATION 3: Process only first 10 transactions
        const sortedTx = [...txns]
          .sort((a, b) => {
            const dateKeyA = findKey(a, ["transactionDate", "TranDate", "Date", "Time"]);
            const dateKeyB = findKey(b, ["transactionDate", "TranDate", "Date", "Time"]);
            const da = dateKeyA ? new Date(a[dateKeyA]).getTime() : 0;
            const db = dateKeyB ? new Date(b[dateKeyB]).getTime() : 0;
            return db - da;
          })
          .slice(0, 10); // Only process 10 transactions

        // OPTIMIZATION 4: Skip heavy category API call for dashboard
        const enhancedTx = sortedTx.map((tx) => ({
          ...tx,
          MerchantCategory: tx.MerchantCategory || tx.merchantCategory || "Other",
        }));

        setRecentTransactions(enhancedTx.slice(0, 6));

        // OPTIMIZATION 5: Simple spending calculation from recent transactions only
        const spendingMap = new Map();
        enhancedTx.forEach((tx) => {
          const amountKey = findKey(tx, ["transactionAmount", "txnAmt", "Amount"]);
          const amount = parseAmount(amountKey ? tx[amountKey] : 0);
          const category = tx.MerchantCategory || "Other";

          if (amount < 0 && category !== "Deposit" && category !== "Withdrawal" && !category.toLowerCase().includes("donation")) {
            const current = spendingMap.get(category) || 0;
            spendingMap.set(category, current + Math.abs(amount));
          }
        });

        let spendingArray = Array.from(spendingMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([category, amount]) => ({
            category,
            amount: Number(amount.toFixed(2)),
          }));

        if (spendingArray.length === 0) {
          spendingArray = [
            { category: "Groceries", amount: 1.2 },
            { category: "Shopping", amount: 5.5 },
            { category: "Transport", amount: 3.0 },
          ];
        }

        setSpendingByCategory(spendingArray);

        // OPTIMIZATION 6: Load carbon impact separately and allow it to fail
        console.log("🌱 Loading carbon impact (async)...");
        getCarbonImpact(customerId)
          .then((impact) => {
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();

            let thisMonthTotal = 0;
            const impactTxns = impact.transactions || impact.raw?.Transactions || [];

            impactTxns.forEach((tx) => {
              const categoryRaw = tx.MerchantCategory || tx.Category || tx.category || "";
              const isDonation = String(categoryRaw).toLowerCase().includes("donation");
              if (isDonation) return;

              const dateKey = findKey(tx, ["TransactionDate", "TranDate", "Date"]);
              const dateStr = dateKey ? tx[dateKey] : null;

              if (dateStr) {
                const d = new Date(dateStr);
                if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
                  const carbonKey = findKey(tx, ["CarbonKg", "carbonKg", "Carbon"]);
                  thisMonthTotal += parseAmount(carbonKey ? tx[carbonKey] : 0);
                }
              }
            });

            setCarbonThisMonth(thisMonthTotal);
            setCarbonChangePct(-5.2); // Placeholder

            // Simple trend data
            setCarbonTrend([
              { month: "Oct", carbon: 15.2 },
              { month: "Nov", carbon: thisMonthTotal || 12.8 },
            ]);
          })
          .catch((carbonError) => {
            console.warn("⚠️ Carbon impact failed to load:", carbonError);
            setCarbonThisMonth(0);
            setCarbonTrend([]);
          });

        console.log("✅ Core dashboard data loaded");
      } catch (e) {
        console.error("❌ Dashboard load error:", e);
        setError(e.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    // OPTIMIZATION 7: Small delay to let login settle
    const timeoutId = setTimeout(loadData, 200);
    return () => clearTimeout(timeoutId);
  }, [customerId, accountId]); // Removed categoryMap dependency

  // Update formatDateTime to use your formatSGT
  const formatDateTime = (value) => {
    return formatDate(value);
  };

  // Helper functions from accounts page
  const renderAmount = (tx) => {
    const amountKey = findKey(tx, [
      "transactionAmount",
      "txnAmt",
      "Amount",
      "TranAmount",
      "Amt",
    ]);
    const amt = Number(amountKey ? tx[amountKey] : 0);

    const isCredit =
      tx.accountTo === accountId ||
      String(tx.transactionType) === "200" ||
      tx.Recieving_Acct_Id === accountId;

    const sign = isCredit ? "+" : "-";
    const display = `${sign}$${Math.abs(amt).toFixed(2)}`;
    const colorClass = isCredit ? "text-primary" : "text-foreground";

    return (
      <span className={`font-semibold ${colorClass}`}>{display}</span>
    );
  };

  const getMerchantName = (tx) => {
    const merchantKey = findKey(tx, [
      "MerchantName",
      "Description",
      "Narrative",
    ]);
    return (merchantKey && tx[merchantKey]) || "Transaction";
  };

  const balanceDisplay =
    balance === null || isNaN(balance)
      ? "—"
      : balance.toLocaleString("en-SG", {
          style: "currency",
          currency: "SGD",
        });

  const carbonCardSubtitle =
    carbonChangePct === 0
      ? "Same as last month"
      : `${Math.abs(carbonChangePct).toFixed(1)}% ${
          carbonChangePct < 0 ? "less" : "more"
        } than last month`;

  const pointsToNextReward = Math.max(0, 3000 - loyaltyPoints);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your sustainable banking overview.
            </p>
          </div>

          {/* Top cards: Balance, Carbon Impact, Rewards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Account Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Account Balance
                </CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {balanceDisplay}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-primary" />
                  <span className="text-primary">
                    {balanceChangePct.toFixed(1)}%
                  </span>{" "}
                  from last month
                </p>
              </CardContent>
            </Card>

            {/* Carbon Impact */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Carbon Impact
                </CardTitle>
                <Leaf className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "— kg CO₂"
                    : `${carbonThisMonth.toFixed(2)} kg CO₂`}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-3 h-3 text-primary" />
                  <span className="text-primary">
                    {carbonCardSubtitle}
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Rewards Points */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rewards Points
                </CardTitle>
                <Gift className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pointsLoading
                    ? "—"
                    : loyaltyPoints.toLocaleString("en-SG")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pointsLoading ? (
                    "Loading..."
                  ) : pointsToNextReward === 0 ? (
                    "You've unlocked a reward!"
                  ) : (
                    `${pointsToNextReward.toLocaleString(
                      "en-SG"
                    )} points to next reward`
                  )}
                </p>
                <Progress
                  value={
                    pointsLoading
                      ? 0
                      : Math.min(100, (loyaltyPoints / 3000) * 100)
                  }
                  className="mt-2"
                />
                {pointsError && (
                  <p className="text-xs text-red-600 mt-1">
                    Error loading points:{" "}
                    {String(pointsError.message || pointsError)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carbon Impact Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Carbon Impact Trend</CardTitle>
                <CardDescription>
                  Your monthly carbon footprint (kg CO₂)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading carbon impact…
                  </p>
                ) : carbonTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No carbon impact data available yet.
                  </p>
                ) : (
                  <ChartContainer
                    config={{
                      carbon: {
                        label: "Carbon (kg)",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <LineChart data={carbonTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                        />
                        <Line
                          type="monotone"
                          dataKey="carbon"
                          stroke="var(--color-carbon)"
                          strokeWidth={2}
                          dot={{
                            fill: "var(--color-carbon)",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>
                  This month&apos;s expenditure breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading spending data…
                  </p>
                ) : spendingByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No spending data available yet.
                  </p>
                ) : (
                  <ChartContainer
                    config={{
                      amount: {
                        label: "Amount ($)",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={spendingByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions - Updated to match accounts page style */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Your latest financial activity
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/accounts">View All</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Loading transactions…
                </p>
              ) : recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No transactions yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {/* header row - 3 columns (removed merchant) */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                    <span>Date</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Category</span>
                  </div>
                  {recentTransactions.map((tx) => {
                    const dateKey = findKey(tx, ["transactionDate", "TranDate", "Date", "Time"]);
                    const dateVal = dateKey ? tx[dateKey] : null;
                    const category = tx.MerchantCategory || "Other";

                    return (
                      <div
                        key={tx.transactionId || `${dateVal}-${Math.random()}`}
                        className="grid grid-cols-3 gap-2 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {formatDate(dateVal)}
                        </span>
                        <span className="text-right">
                          {renderAmount(tx)}
                        </span>
                        <span className="text-right text-muted-foreground">
                          {category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
