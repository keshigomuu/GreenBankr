"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ArrowRight, User, Building2, Leaf, Loader2 } from "lucide-react"

const recentRecipients = [
  { id: 1, name: "Sarah Johnson", email: "sarah@example.com", type: "personal" },
  { id: 2, name: "Mike Chen", email: "mike@example.com", type: "personal" },
  { id: 3, name: "Green Energy Co.", email: "billing@greenenergy.com", type: "business" },
]

export default function TransferPage() {
  const [transferType, setTransferType] = useState("personal")
  const [amount, setAmount] = useState("")
  const [recipient, setRecipient] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [enableRounding, setEnableRounding] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const carbonImpact = amount ? (Number.parseFloat(amount) * 0.02).toFixed(2) : "0.00"
  const roundedAmount = amount && enableRounding ? Math.ceil(Number.parseFloat(amount)) : amount

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      alert("Transfer successful!")
      // Reset form
      setAmount("")
      setRecipient("")
      setCategory("")
      setDescription("")
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transfer Money</h1>
            <p className="text-muted-foreground mt-1">Send money to friends, family, or businesses</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transfer Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>New Transfer</CardTitle>
                  <CardDescription>Fill in the details to send money</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Tabs value={transferType} onValueChange={setTransferType}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="personal">
                          <User className="w-4 h-4 mr-2" />
                          Personal
                        </TabsTrigger>
                        <TabsTrigger value="business">
                          <Building2 className="w-4 h-4 mr-2" />
                          Business
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="space-y-2">
                      <Label htmlFor="recipient">Recipient</Label>
                      <Input
                        id="recipient"
                        placeholder="Email or account number"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food & Dining</SelectItem>
                          <SelectItem value="transport">Transportation</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        placeholder="What's this for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Leaf className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">Round up for donations</p>
                          <p className="text-xs text-muted-foreground">
                            {enableRounding && amount
                              ? `Round to $${roundedAmount} (+$${(roundedAmount - Number.parseFloat(amount)).toFixed(2)})`
                              : "Help the environment with spare change"}
                          </p>
                        </div>
                      </div>
                      <Switch checked={enableRounding} onCheckedChange={setEnableRounding} />
                    </div>

                    <Button type="submit" className="w-full" disabled={isProcessing}>
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Send ${amount || "0.00"}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Carbon Impact Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Carbon Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Leaf className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{carbonImpact} kg</p>
                    <p className="text-sm text-muted-foreground mt-1">Estimated CO₂ for this transaction</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Recipients */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Recipients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentRecipients.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => setRecipient(rec.email)}
                        className="w-full p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {rec.type === "personal" ? (
                              <User className="w-4 h-4 text-primary" />
                            ) : (
                              <Building2 className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{rec.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{rec.email}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
