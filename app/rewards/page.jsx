"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Gift, Star, Trophy, Zap, Coffee, ShoppingBag, Ticket } from "lucide-react"

const rewards = [
  {
    id: 1,
    name: "$5 Coffee Voucher",
    icon: Coffee,
    points: 500,
    description: "Redeemable at eco-friendly coffee shops",
    category: "Food & Drink",
    available: true,
  },
  {
    id: 2,
    name: "$10 Shopping Credit",
    icon: ShoppingBag,
    points: 1000,
    description: "Use at sustainable fashion retailers",
    category: "Shopping",
    available: true,
  },
  {
    id: 3,
    name: "Movie Tickets (2x)",
    icon: Ticket,
    points: 1500,
    description: "Two tickets to any participating cinema",
    category: "Entertainment",
    available: true,
  },
  {
    id: 4,
    name: "$25 Cashback",
    icon: Gift,
    points: 2500,
    description: "Direct cashback to your account",
    category: "Cashback",
    available: true,
  },
  {
    id: 5,
    name: "$50 Eco Store Credit",
    icon: ShoppingBag,
    points: 5000,
    description: "Shop at premium eco-friendly stores",
    category: "Shopping",
    available: false,
  },
  {
    id: 6,
    name: "$100 Donation Match",
    icon: Trophy,
    points: 10000,
    description: "We'll match your next donation up to $100",
    category: "Charity",
    available: false,
  },
]

const pointsHistory = [
  { id: 1, action: "Eco-friendly purchase", points: 50, date: "2025-10-22" },
  { id: 2, action: "Monthly green goal achieved", points: 200, date: "2025-10-20" },
  { id: 3, action: "Public transport usage", points: 25, date: "2025-10-18" },
  { id: 4, action: "Donation to charity", points: 100, date: "2025-10-15" },
]

export default function RewardsPage() {
  const currentPoints = 2450
  const nextTierPoints = 3000
  const progress = (currentPoints / nextTierPoints) * 100

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rewards</h1>
            <p className="text-muted-foreground mt-1">Redeem your points for exclusive rewards</p>
          </div>

          {/* Points Overview */}
          <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Points Balance</p>
                    <p className="text-4xl font-bold text-foreground">{currentPoints.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex-1 max-w-md w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress to Gold Tier</span>
                    <span className="text-sm text-muted-foreground">{nextTierPoints - currentPoints} points to go</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Silver Tier</Badge>
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Unlock exclusive rewards at Gold</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Catalog */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rewards</CardTitle>
              <CardDescription>Choose from our selection of eco-friendly rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map((reward) => {
                  const Icon = reward.icon
                  const canAfford = currentPoints >= reward.points
                  return (
                    <div
                      key={reward.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        reward.available && canAfford
                          ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            reward.available && canAfford ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              reward.available && canAfford ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <Badge variant={reward.available ? "default" : "secondary"}>{reward.points} pts</Badge>
                      </div>

                      <h3 className="font-semibold text-foreground mb-1">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
                      <span className="inline-block px-2 py-1 rounded-full bg-muted text-xs font-medium mb-3">
                        {reward.category}
                      </span>

                      <Button
                        className="w-full"
                        disabled={!reward.available || !canAfford}
                        variant={reward.available && canAfford ? "default" : "outline"}
                      >
                        {!reward.available
                          ? "Coming Soon"
                          : !canAfford
                            ? `Need ${reward.points - currentPoints} more points`
                            : "Redeem Now"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Points History */}
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>How you've earned your points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pointsHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">+{item.points} pts</p>
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
