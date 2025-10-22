"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Leaf, ArrowUpRight, ArrowDownRight } from "lucide-react"

const allTransactions = [
  {
    id: 1,
    merchant: "Whole Foods Market",
    amount: -45.32,
    category: "Food & Dining",
    carbon: 1.2,
    date: "2025-10-22",
    time: "10:30 AM",
  },
  {
    id: 2,
    merchant: "Electric Vehicle Charge",
    amount: -12.5,
    category: "Transportation",
    carbon: 0.5,
    date: "2025-10-22",
    time: "08:15 AM",
  },
  {
    id: 3,
    merchant: "Salary Deposit",
    amount: 3500.0,
    category: "Income",
    carbon: 0,
    date: "2025-10-21",
    time: "09:00 AM",
  },
  {
    id: 4,
    merchant: "Local Farmers Market",
    amount: -28.75,
    category: "Food & Dining",
    carbon: 0.8,
    date: "2025-10-20",
    time: "02:45 PM",
  },
  {
    id: 5,
    merchant: "Solar Panel Installation",
    amount: -2500.0,
    category: "Home & Utilities",
    carbon: -50,
    date: "2025-10-19",
    time: "11:00 AM",
  },
  {
    id: 6,
    merchant: "Amazon",
    amount: -89.99,
    category: "Shopping",
    carbon: 5.2,
    date: "2025-10-18",
    time: "03:20 PM",
  },
  {
    id: 7,
    merchant: "Public Transit Pass",
    amount: -120.0,
    category: "Transportation",
    carbon: 2.1,
    date: "2025-10-17",
    time: "07:30 AM",
  },
  {
    id: 8,
    merchant: "Green Energy Co.",
    amount: -85.5,
    category: "Home & Utilities",
    carbon: -10,
    date: "2025-10-16",
    time: "12:00 PM",
  },
  {
    id: 9,
    merchant: "Freelance Payment",
    amount: 850.0,
    category: "Income",
    carbon: 0,
    date: "2025-10-15",
    time: "04:00 PM",
  },
  {
    id: 10,
    merchant: "Eco-Friendly Store",
    amount: -42.3,
    category: "Shopping",
    carbon: 0.5,
    date: "2025-10-14",
    time: "01:15 PM",
  },
]

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [transactions] = useState(allTransactions)

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = ["all", ...new Set(transactions.map((t) => t.category))]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground mt-1">View and manage your transaction history</p>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          transaction.amount > 0 ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <ArrowUpRight className="w-6 h-6 text-primary" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6 text-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{transaction.merchant}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span>{transaction.category}</span>
                          {transaction.carbon !== 0 && (
                            <>
                              <span>•</span>
                              <span
                                className={`flex items-center gap-1 ${transaction.carbon < 0 ? "text-primary" : ""}`}
                              >
                                <Leaf className="w-3 h-3" />
                                {transaction.carbon > 0 ? "+" : ""}
                                {transaction.carbon} kg CO₂
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.date} at {transaction.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${transaction.amount > 0 ? "text-primary" : "text-foreground"}`}>
                        {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
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
