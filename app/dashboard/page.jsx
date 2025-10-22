"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowUpRight, ArrowDownRight, Leaf, TrendingUp, DollarSign, Gift } from "lucide-react"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart.jsx"

const carbonData = [
  { month: "Jan", carbon: 45 },
  { month: "Feb", carbon: 52 },
  { month: "Mar", carbon: 38 },
  { month: "Apr", carbon: 42 },
  { month: "May", carbon: 35 },
  { month: "Jun", carbon: 30 },
]

const spendingData = [
  { category: "Food", amount: 450, carbon: 12 },
  { category: "Transport", amount: 320, carbon: 28 },
  { category: "Shopping", amount: 280, carbon: 15 },
  { category: "Utilities", amount: 180, carbon: 8 },
  { category: "Entertainment", amount: 150, carbon: 5 },
]

const recentTransactions = [
  { id: 1, merchant: "Whole Foods Market", amount: -45.32, category: "Food", carbon: 1.2, date: "Today" },
  { id: 2, merchant: "Electric Vehicle Charge", amount: -12.5, category: "Transport", carbon: 0.5, date: "Today" },
  { id: 3, merchant: "Salary Deposit", amount: 3500.0, category: "Income", carbon: 0, date: "Yesterday" },
  { id: 4, merchant: "Local Farmers Market", amount: -28.75, category: "Food", carbon: 0.8, date: "2 days ago" },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your sustainable banking overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Account Balance</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,458.32</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3 text-primary" />
                  <span className="text-primary">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Carbon Saved</CardTitle>
                <Leaf className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">30 kg CO₂</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-3 h-3 text-primary" />
                  <span className="text-primary">-15%</span> this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Green Score</CardTitle>
                <TrendingUp className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85/100</div>
                <Progress value={85} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rewards Points</CardTitle>
                <Gift className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,450</div>
                <p className="text-xs text-muted-foreground mt-1">550 points to next reward</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carbon Impact Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Carbon Impact Trend</CardTitle>
                <CardDescription>Your monthly carbon footprint (kg CO₂)</CardDescription>
              </CardHeader>
              <CardContent>
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
                    <LineChart data={carbonData}>
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
              </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>This month's expenditure breakdown</CardDescription>
              </CardHeader>
              <CardContent>
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
                    <BarChart data={spendingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="var(--color-amount)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest financial activity</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.amount > 0 ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowUpRight className="w-5 h-5 text-primary" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{transaction.merchant}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{transaction.category}</span>
                          {transaction.carbon > 0 && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Leaf className="w-3 h-3" />
                                {transaction.carbon} kg CO₂
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount > 0 ? "text-primary" : "text-foreground"}`}>
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
