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
import { Leaf, TrendingDown, TreePine, Droplet } from "lucide-react"
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
import { getCarbonImpact } from "@/lib/impact-api"

const ecoTips = [
  {
    icon: TreePine,
    title: "Use Public Transport",
    description:
      "Taking public transit instead of driving can reduce your carbon footprint by up to 45%.",
    impact: "Save 15 kg CO₂/month",
  },
  {
    icon: Leaf,
    title: "Buy Local & Organic",
    description:
      "Shopping at local farmers markets reduces transportation emissions significantly.",
    impact: "Save 8 kg CO₂/month",
  },
  {
    icon: Leaf,
    title: "Switch to Renewable Energy",
    description:
      "Green energy providers can help you reduce your home's carbon footprint to near zero.",
    impact: "Save 25 kg CO₂/month",
  },
  {
    icon: Droplet,
    title: "Reduce Water Usage",
    description:
      "Shorter showers and efficient appliances can significantly reduce energy consumption.",
    impact: "Save 5 kg CO₂/month",
  },
]

export default function CarbonImpactPage() {
  const { user, getCustomerId } = useAuth()

  const customerId =
    (typeof getCustomerId === "function" && getCustomerId()) ||
    user?.customerId ||
    user?.customerID ||
    null

  const [thisMonthKg, setThisMonthKg] = useState(0)
  const [changePct, setChangePct] = useState(0)
  const [totalSavedKg, setTotalSavedKg] = useState(0)
  const [treesEq, setTreesEq] = useState(0)
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!customerId) {
      setLoading(false)
      setError("Please log in to view your carbon impact.")
      return
    }

    const loadImpact = async () => {
      try {
        setLoading(true)
        setError("")

        const impact = await getCarbonImpact(customerId)
        const raw = impact.raw || {}

        // === Totals ===
        const totalSaved =
          Number(impact.totalCarbonSaved ?? raw.TotalCarbonKg ?? 0) || 0
        setTotalSavedKg(totalSaved)

        const transactions =
          impact.transactions ||
          raw.Transactions ||
          []

        // === Date helpers ===
        const now = new Date()
        const thisMonthIndex = now.getMonth()
        const thisYear = now.getFullYear()
        const prevMonthDate = new Date(thisYear, thisMonthIndex - 1, 1)
        const prevMonthIndex = prevMonthDate.getMonth()
        const prevMonthYear = prevMonthDate.getFullYear()

        let thisMonthTotal = 0
        let prevMonthTotal = 0

        const monthlyMap = new Map()
        const categoryMap = new Map()

        transactions.forEach((tx) => {
          const dateStr =
            tx.TransactionDate ||
            tx.transactionDate ||
            tx.Date ||
            tx.date ||
            null

          const carbonKg =
            Number(
              tx.CarbonKg ??
                tx.carbonKg ??
                tx.Carbon ??
                tx.carbon ??
                0
            ) || 0

          let d = null
          if (dateStr) {
            const parsed = new Date(dateStr)
            if (!isNaN(parsed.valueOf())) {
              d = parsed
            }
          }

          // === Monthly aggregation ===
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

          // === Category aggregation ===
          const category =
            tx.MerchantCategory ||
            tx.Category ||
            tx.category ||
            "Other"
          categoryMap.set(
            category,
            (categoryMap.get(category) || 0) + carbonKg
          )
        })

        setThisMonthKg(thisMonthTotal)

        let change = 0
        if (prevMonthTotal > 0) {
          change =
            ((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
        }
        setChangePct(change)

        const trees =
          raw.TreesEquivalent ??
          raw.TreeEquivalent ??
          (totalSaved > 0 ? totalSaved / 20 : 0)
        setTreesEq(Number(trees) || 0)

        const monthlyArray = Array.from(monthlyMap.entries())
          .filter(([key]) => key !== "Unknown")
          .sort((a, b) => {
            const [ya, ma] = a[0].split("-").map(Number)
            const [yb, mb] = b[0].split("-").map(Number)
            return new Date(ya, ma - 1, 1) - new Date(yb, mb - 1, 1)
          })
          .map(([key, value]) => {
            const [y, m] = key.split("-").map(Number)
            const label = new Date(y, m - 1, 1).toLocaleString("default", {
              month: "short",
            })
            return {
              month: label,
              carbon: Number(value.toFixed(3)),
            }
          })

        setMonthlyData(monthlyArray)

        const categoryArray = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([category, value]) => ({
            category,
            carbon: Number(value.toFixed(3)),
          }))

        setCategoryData(categoryArray)
      } catch (e) {
        console.error("Failed to load carbon impact:", e)
        setError(e.message || "Failed to load carbon impact.")
      } finally {
        setLoading(false)
      }
    }

    loadImpact()
  }, [customerId])

  const changeText =
    changePct === 0
      ? "Same as last month"
      : `${Math.abs(changePct).toFixed(1)}% ${
          changePct < 0 ? "less" : "more"
        } than last month`

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Carbon Impact
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and reduce your environmental footprint
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
                <Leaf className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "—"
                    : `${thisMonthKg.toFixed(2)} kg CO₂`}
                </div>
                {!loading && !error && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-1">
                    <TrendingDown className="w-3 h-3" />
                    {changeText}
                  </p>
                )}
                {!loading && error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Saved
                </CardTitle>
                <TreePine className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading
                    ? "—"
                    : `${totalSavedKg.toFixed(2)} kg CO₂`}
                </div>
                {!loading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Equivalent to {treesEq.toFixed(0)} trees planted
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Carbon Footprint Trend</CardTitle>
                <CardDescription>Monthly carbon emissions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading carbon impact…
                  </p>
                ) : error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : monthlyData.length === 0 ? (
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
                      <LineChart data={monthlyData}>
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

            <Card>
              <CardHeader>
                <CardTitle>Carbon by Category</CardTitle>
                <CardDescription>
                  Breakdown of your carbon footprint
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading carbon impact…
                  </p>
                ) : error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : categoryData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No category breakdown data available yet.
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
                      <BarChart data={categoryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="category"
                          type="category"
                          width={80}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="carbon"
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Eco tips */}
          <Card>
            <CardHeader>
              <CardTitle>Eco-Friendly Tips</CardTitle>
              <CardDescription>
                Simple ways to reduce your carbon footprint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ecoTips.map((tip, index) => {
                  const Icon = tip.icon
                  return (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {tip.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {tip.description}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            {tip.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
