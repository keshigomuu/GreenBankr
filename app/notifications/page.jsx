"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, X, ArrowRight, Heart, Gift, Leaf, DollarSign } from "lucide-react"

const allNotifications = [
  {
    id: 1,
    type: "transaction",
    icon: DollarSign,
    title: "Payment Received",
    message: "You received $3,500.00 from Acme Corp",
    time: "2 hours ago",
    read: false,
    actionUrl: "/transactions",
  },
  {
    id: 2,
    type: "donation",
    icon: Heart,
    title: "Donation Successful",
    message: "Your $5.50 donation to Ocean Cleanup Initiative was processed",
    time: "5 hours ago",
    read: false,
    actionUrl: "/donations",
  },
  {
    id: 3,
    type: "reward",
    icon: Gift,
    title: "New Reward Available",
    message: "You've unlocked a $10 Shopping Credit reward!",
    time: "1 day ago",
    read: true,
    actionUrl: "/rewards",
  },
  {
    id: 4,
    type: "carbon",
    icon: Leaf,
    title: "Carbon Goal Achieved",
    message: "Congratulations! You've reduced your carbon footprint by 15% this month",
    time: "2 days ago",
    read: true,
    actionUrl: "/impact",
  },
  {
    id: 5,
    type: "transaction",
    icon: DollarSign,
    title: "Payment Sent",
    message: "You sent $45.32 to Whole Foods Market",
    time: "3 days ago",
    read: true,
    actionUrl: "/transactions",
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(allNotifications)
  const [filter, setFilter] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground mt-1">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                  All
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("unread")}
                >
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={filter === "transaction" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("transaction")}
                >
                  Transactions
                </Button>
                <Button
                  variant={filter === "donation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("donation")}
                >
                  Donations
                </Button>
                <Button
                  variant={filter === "reward" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("reward")}
                >
                  Rewards
                </Button>
                <Button
                  variant={filter === "carbon" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("carbon")}
                >
                  Carbon Impact
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === "all"
                  ? "All Notifications"
                  : filter === "unread"
                    ? "Unread Notifications"
                    : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Notifications`}
              </CardTitle>
              <CardDescription>
                Showing {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications to show</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification) => {
                    const Icon = notification.icon
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          notification.read ? "border-border bg-background" : "border-primary/50 bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              notification.read ? "bg-muted" : "bg-primary/20"
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${notification.read ? "text-muted-foreground" : "text-primary"}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{notification.title}</h3>
                              {!notification.read && (
                                <Badge variant="default" className="flex-shrink-0">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mb-3">{notification.time}</p>

                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <a href={notification.actionUrl}>
                                  View Details
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </a>
                              </Button>
                              {!notification.read && (
                                <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                                  <Check className="w-3 h-3 mr-1" />
                                  Mark as read
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => deleteNotification(notification.id)}>
                                <X className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
