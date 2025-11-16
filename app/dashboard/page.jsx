"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Leaf, Gift, User, Mail, Phone, CreditCard, Hash } from "lucide-react";
import { getDepositBalance } from "@/lib/account-api";
import { getCarbonImpact } from "@/lib/impact-api";
import { useLoyaltyBalance } from "@/hooks/useLoyaltyBalance";

export default function DashboardPage() {
  const { user, getCustomerId, getDepositAccount } = useAuth();

  const customerId = getCustomerId();
  const accountId = getDepositAccount?.();

  const [balance, setBalance] = useState(null);
  const [carbonSaved, setCarbonSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    balance: loyaltyPoints,
    loading: pointsLoading,
    error: pointsError,
  } = useLoyaltyBalance(customerId);

  useEffect(() => {
    if (!customerId || !accountId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch balance
        const balanceData = await getDepositBalance(customerId, accountId);
        setBalance(balanceData);

        // Fetch carbon impact
        const carbonData = await getCarbonImpact(customerId);
        setCarbonSaved(carbonData?.totalCarbonSaved || 0);

      } catch (err) {
        console.error("Dashboard data load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [customerId, accountId]);

  const balanceDisplay =
    balance === null || isNaN(balance)
      ? "—"
      : balance.toLocaleString("en-SG", {
          style: "currency",
          currency: "SGD",
        });

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
              Welcome back, {user?.name || "Customer"}! Here&apos;s your sustainable banking overview.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              <p className="font-semibold">Error loading data:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* User Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Profile
              </CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-base font-semibold">{user?.name || "—"}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base font-semibold">{user?.email || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-base font-semibold">{user?.phone || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
                    <p className="text-base font-semibold font-mono">{customerId || "—"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Deposit Account</p>
                    <p className="text-base font-semibold font-mono">{accountId || "—"}</p>
                  </div>
                </div>

                {user?.icNumber && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">IC Number</p>
                      <p className="text-base font-semibold">{user.icNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Balance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Account Balance
                </CardTitle>
                <DollarSign className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-2xl font-bold text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {balanceDisplay}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your current deposit account balance
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Carbon Impact */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Carbon Impact
                </CardTitle>
                <Leaf className="w-5 h-5 text-green-600" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-2xl font-bold text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-green-600">
                      {carbonSaved.toFixed(2)} kg
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total CO₂ saved through your sustainable choices
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Rewards Points */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rewards Points
                </CardTitle>
                <Gift className="w-5 h-5 text-primary" />
              </CardHeader>
              <CardContent>
                {pointsLoading ? (
                  <div className="text-2xl font-bold text-muted-foreground">
                    Loading...
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold">
                      {(loyaltyPoints || 0).toLocaleString("en-SG")}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Available for rewards redemption
                    </p>
                    {pointsError && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {String(pointsError)}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to key features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a
                  href="/accounts"
                  className="flex flex-col items-center justify-center p-6 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <CreditCard className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Accounts</span>
                </a>
                
                <a
                  href="/transactions"
                  className="flex flex-col items-center justify-center p-6 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <DollarSign className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Transactions</span>
                </a>

                <a
                  href="/rewards"
                  className="flex flex-col items-center justify-center p-6 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Gift className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Rewards</span>
                </a>

                <a
                  href="/carbon-impact"
                  className="flex flex-col items-center justify-center p-6 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Leaf className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Carbon Impact</span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
