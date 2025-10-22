"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, TreePine, Droplet, Wind, Users } from "lucide-react"

const organizations = [
  {
    id: 1,
    name: "Ocean Cleanup Initiative",
    icon: Droplet,
    description: "Removing plastic from oceans and preventing pollution",
    raised: 45000,
    goal: 100000,
    impact: "2,500 kg of plastic removed",
    category: "Environment",
  },
  {
    id: 2,
    name: "Reforestation Project",
    icon: TreePine,
    description: "Planting trees to combat climate change",
    raised: 78000,
    goal: 100000,
    impact: "15,000 trees planted",
    category: "Climate",
  },
  {
    id: 3,
    name: "Clean Air Campaign",
    icon: Wind,
    description: "Reducing air pollution in urban areas",
    raised: 32000,
    goal: 75000,
    impact: "8 cities improved",
    category: "Environment",
  },
  {
    id: 4,
    name: "Community Gardens",
    icon: Users,
    description: "Building sustainable food sources in communities",
    raised: 18000,
    goal: 50000,
    impact: "25 gardens established",
    category: "Community",
  },
]

const donationHistory = [
  { id: 1, organization: "Ocean Cleanup Initiative", amount: 5.5, date: "2025-10-20", source: "Rounded" },
  { id: 2, organization: "Reforestation Project", amount: 25.0, date: "2025-10-15", source: "Manual" },
  { id: 3, organization: "Clean Air Campaign", amount: 3.25, date: "2025-10-12", source: "Rounded" },
  { id: 4, organization: "Community Gardens", amount: 10.0, date: "2025-10-08", source: "Manual" },
]

export default function DonationsPage() {
  const [selectedOrg, setSelectedOrg] = useState(null)

  const totalDonated = donationHistory.reduce((sum, donation) => sum + donation.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Donations</h1>
            <p className="text-muted-foreground mt-1">Support causes you care about</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
                <Heart className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalDonated.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Across {donationHistory.length} donations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                <TreePine className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$43.75</div>
                <p className="text-xs text-muted-foreground mt-1">4 organizations supported</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Carbon Offset</CardTitle>
                <Wind className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12 kg CO₂</div>
                <p className="text-xs text-muted-foreground mt-1">Through your donations</p>
              </CardContent>
            </Card>
          </div>

          {/* Organizations */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Organizations</CardTitle>
              <CardDescription>Choose where your donations make an impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organizations.map((org) => {
                  const Icon = org.icon
                  const progress = (org.raised / org.goal) * 100
                  return (
                    <div
                      key={org.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{org.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{org.description}</p>
                          <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {org.category}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            ${org.raised.toLocaleString()} / ${org.goal.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={progress} />
                        <p className="text-xs text-primary font-medium">{org.impact}</p>
                      </div>

                      <Button className="w-full" onClick={() => setSelectedOrg(org.id)}>
                        <Heart className="w-4 h-4 mr-2" />
                        Donate Now
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Donation History */}
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
              <CardDescription>Your recent contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {donationHistory.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{donation.organization}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{donation.date}</span>
                          <span>•</span>
                          <span className={donation.source === "Rounded" ? "text-primary" : ""}>{donation.source}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">${donation.amount.toFixed(2)}</p>
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
