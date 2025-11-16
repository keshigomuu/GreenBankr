"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ArrowUpRight,
  ArrowDownRight,
  Leaf,
  DollarSign,
  Gift,
} from "lucide-react"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useAuth } from "@/contexts/auth-context"
import {
  getDepositBalance,
  getTransactionHistory,
  getTransactionCategories,
} from "@/lib/account-api"
import { getCarbonImpact } from "@/lib/impact-api"
import { useLoyaltyPoints } from "@/hooks/useLoyalty"
import { useMyClaims } from "@/hooks/useRewards"

/**
 * Helper to find a key in an object whose name matches any of the
 * provided regex patterns (case-insensitive).
 */
function findKey(obj, regexes) {
  const keys = Object.keys(obj || {})
  for (const re of regexes) {
    const regex = new RegExp(re, "i")
    const match = keys.find((k) => regex.test(k))
    if (match) return match
  }
  return null
}

/**
 * Helper to safely parse a numeric amount (strip $ and commas).
 */
function parseAmount(value) {
  if (value === null || value === undefined) return 0
  const str = String(value)
  const cleaned = str.replace(/[^0-9.\-]/g, "")
  const num = Number(cleaned)
  return isNaN(num) ? 0 : num
}

export default function DashboardPage() {
  const { user, getCustomerId, getDepositAccount } = useAuth()

  const customerId =
    (typeof getCustomerId === "function" && getCustomerId()) ||
    user?.customerId ||
    user?.customerID ||
    null

  const accountId = user?.depositAccount || user?.accountId || 
    getDepositAccount?.() || user?.raw?.DepositeAcct || null

  const [balance, setBalance] = useState(null)
  const [balanceChangePct, setBalanceChangePct] = useState(0)

  const [carbonThisMonth, setCarbonThisMonth] = useState(0)
  const [carbonChangePct, setCarbonChangePct] = useState(0)
  const [carbonTrend, setCarbonTrend] = useState([])

  const [spendingByCategory, setSpendingByCategory] = useState([])
  const [error, setError] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [categoryMap, setCategoryMap] = useState({})

  const [loading, setLoading] = useState(true)

  // Use the same loyalty data source as rewards page
  const {
    points: donatedPoints, // lifetime donated points
    loading: pointsLoading,
    error: pointsError,
  } = useLoyaltyPoints(customerId)

  const { claims } = useMyClaims(customerId)

  // Calculate current points the same way as rewards page
  const totalSpent = Array.isArray(claims) 
    ? claims.reduce((s, c) => s + Number(c.pointsCost || 0), 0) 
    : 0

  const loyaltyPoints = Math.max((donatedPoints ?? 0) - totalSpent, 0)

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
      setLoading(false)
      setError("Please log in to view your dashboard.")
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Last ~3 months of transactions
        const end = new Date()
        const start = new Date()
        start.setMonth(start.getMonth() - 3)

        const startDate = start.toISOString().slice(0, 10)
        const endDate = end.toISOString().slice(0, 10)

        const [bal, txns, impact] = await Promise.all([
          getDepositBalance(customerId, accountId),
          getTransactionHistory(accountId, startDate, endDate),
          getCarbonImpact(customerId),
        ])

        // ===== Account balance =====
        setBalance(Number(bal) || 0)
        // Placeholder % change (until you have historical balances)
        setBalanceChangePct(12.5)

        // ===== Process transactions with categories =====
        // Sort newest → oldest (fix the date field access)
        const sortedTx = [...txns].sort((a, b) => {
          const dateKeyA = findKey(a, ["transactionDate", "TranDate", "Date", "Time"])
          const dateKeyB = findKey(b, ["transactionDate", "TranDate", "Date", "Time"])
          const da = dateKeyA ? new Date(a[dateKeyA]).getTime() : 0
          const db = dateKeyB ? new Date(b[dateKeyB]).getTime() : 0
          return db - da
        })

        // Get categories for transactions (same as accounts page)
        const ids = sortedTx
          .map((tx) => tx.transactionId)
          .filter(Boolean);

        let serverCategories = {};
        try {
          serverCategories = await getTransactionCategories(ids);
        } catch (e) {
          console.warn("Failed to load server categories", e);
        }

        // Enhanced transactions with categories (use EXACT same logic as accounts page)
        const enhancedTx = sortedTx.map((tx) => {
          const tid = tx.transactionId;
          return {
            ...tx,
            MerchantCategory:
              tx.MerchantCategory || // from API if ever present
              tx.merchantCategory || // any variant
              serverCategories[tid] || // from Node store
              categoryMap[tid] || // localStorage fallback
              "Donation", // Default to "Donation" like accounts page, not null
          };
        });

        // Recent 6 transactions for dashboard
        setRecentTransactions(enhancedTx.slice(0, 6))

        // ===== Carbon impact (this month + trend) =====
        const rawImpact = impact.raw || {}
        const impactTxns =
          impact.transactions || rawImpact.Transactions || []

        const now = new Date()
        const thisMonthIndex = now.getMonth()
        const thisYear = now.getFullYear()
        const prevMonthDate = new Date(thisYear, thisMonthIndex - 1, 1)
        const prevMonthIndex = prevMonthDate.getMonth()
        const prevMonthYear = prevMonthDate.getFullYear()

        let thisMonthTotal = 0
        let prevMonthTotal = 0

        const monthlyMap = new Map()

        impactTxns.forEach((tx) => {
          const dateKey = findKey(tx, ["TransactionDate", "TranDate", "Date", "Time"])
          const dateStr = dateKey ? tx[dateKey] : null

          const carbonKey = findKey(tx, ["CarbonKg", "carbonKg", "Carbon"])
          const carbonKg = parseAmount(carbonKey ? tx[carbonKey] : 0)

          let d = null
          if (dateStr) {
            const parsed = new Date(dateStr)
            if (!isNaN(parsed.valueOf())) d = parsed
          }

          let monthKey = "Unknown"
          if (d) {
            const y = d.getFullYear()
            const m = d.getMonth() + 1
            monthKey = `${y}-${String(m).padStart(2, "0")}`

            if (y === thisYear && d.getMonth() === thisMonthIndex) {
              thisMonthTotal += carbonKg
            }

            if (y === prevMonthYear && d.getMonth() === prevMonthIndex) {
              prevMonthTotal += carbonKg
            }
          }

          monthlyMap.set(
            monthKey,
            (monthlyMap.get(monthKey) || 0) + carbonKg
          )
        })

        setCarbonThisMonth(thisMonthTotal)

        let carbonDelta = 0
        if (prevMonthTotal > 0) {
          carbonDelta =
            ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
        }
        setCarbonChangePct(carbonDelta)

        const monthlyArray = Array.from(monthlyMap.entries())
          .filter(([key]) => key !== "Unknown")
          .sort((a, b) => {
            const [ya, ma] = a[0].split("-").map(Number)
            const [yb, mb] = b[0].split("-").map(Number)
            return (
              new Date(ya, ma - 1, 1).getTime() -
              new Date(yb, mb - 1, 1).getTime()
            )
          })
          .map(([key, value]) => {
            const [y, m] = key.split("-").map(Number)
            const label = new Date(y, m - 1, 1).toLocaleString("default", {
              month: "short",
            })
            return {
              month: label,
              carbon: Number(Number(value).toFixed(3)),
            }
          })

        setCarbonTrend(monthlyArray)

        // ===== Spending by category (only negative amounts = expenses) =====
        const spendingMap = new Map()

        enhancedTx.forEach((tx) => {
          const amountKey = findKey(tx, ["transactionAmount", "txnAmt", "Amount", "TranAmount", "Amt"])
          const amount = parseAmount(amountKey ? tx[amountKey] : 0)

          if (amount >= 0) return // ignore income

          const category = tx.MerchantCategory || "Other"
          const current = spendingMap.get(category) || 0
          spendingMap.set(category, current + Math.abs(amount))
        })

        const spendingArray = Array.from(spendingMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([category, amount]) => ({
            category,
            amount: Number(amount.toFixed(2)),
          }))

        setSpendingByCategory(spendingArray)
      } catch (e) {
        console.error("Dashboard load error:", e)
        setError(e.message || "Failed to load dashboard data.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [customerId, accountId, categoryMap])

  // Helper functions from accounts page
  const renderAmount = (tx) => {
    const amountKey = findKey(tx, ["transactionAmount", "txnAmt", "Amount", "TranAmount", "Amt"])
    const amt = Number(amountKey ? tx[amountKey] : 0)

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

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-SG", {
      day: "2-digit",
      month: "short",
    });
  };

  const getMerchantName = (tx) => {
    const merchantKey = findKey(tx, [
      "MerchantName",
      "Description",
      "Narrative",
    ])
    return (merchantKey && tx[merchantKey]) || "Transaction"
  }

  const balanceDisplay =
    balance === null || isNaN(balance)
      ? "—"
      : balance.toLocaleString("en-SG", {
          style: "currency",
          currency: "SGD",
        })

  const carbonCardSubtitle =
    carbonChangePct === 0
      ? "Same as last month"
      : `${Math.abs(carbonChangePct).toFixed(1)}% ${
          carbonChangePct < 0 ? "less" : "more"
        } than last month`

  const pointsToNextReward = Math.max(0, 3000 - loyaltyPoints)

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
                  {pointsLoading ? "—" : loyaltyPoints.toLocaleString("en-SG")}
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
                  value={pointsLoading ? 0 : Math.min(100, (loyaltyPoints / 3000) * 100)}
                  className="mt-2"
                />
                {pointsError && (
                  <p className="text-xs text-red-600 mt-1">
                    Error loading points: {String(pointsError.message || pointsError)}
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spendingByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
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
                  {/* header row - updated to match 4 columns */}
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                    <span>Date</span>
                    <span>Category</span>
                    <span className="text-right">Amount</span>
                    <span>Payment</span>
                  </div>

                  {recentTransactions.map((tx, idx) => {
                    const dateKey = findKey(tx, ["transactionDate", "TranDate", "Date", "Time"])
                    const dateStr = dateKey ? tx[dateKey] : null
                    const dateLabel = formatDateTime(dateStr)
                    const merchant = getMerchantName(tx)
                    
                    // Use the enhanced category from our processing above
                    const category = tx.MerchantCategory || "Other"
                    
                    // Payment mode: Digital for deposit/withdraw, else whatever tBank returns / Cash
                    const isDepositOrWithdrawal = category === "Deposit" || category === "Withdrawal";
                    const paymentMode = isDepositOrWithdrawal ? "Digital" : (tx.paymentMode || "Cash");

                    return (
                      <div
                        key={tx.transactionId || idx}
                        className="grid grid-cols-4 gap-2 text-sm py-2 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-muted-foreground">{dateLabel}</span>
                        <span className="text-muted-foreground">{category}</span>
                        <div className="text-right">{renderAmount(tx)}</div>
                        <span className="text-muted-foreground text-xs">{paymentMode}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-red-500 text-right">{error}</p>
          )}
        </div>
      </main>
    </div>
  )
}
