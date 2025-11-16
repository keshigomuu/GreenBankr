"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Zap } from "lucide-react";
import RewardCard from "@/components/rewards/RewardCard";
import ClaimsTable from "@/components/rewards/ClaimsTable";
import { useRewardsCatalog, useMyClaims } from "@/hooks/useRewards";
import { useLoyaltyBalance } from "@/hooks/useLoyaltyBalance";


/* Tier logic unchanged */
function computeTier(lifetime) {
  if (lifetime >= 3500) return { name: "Gold", currentMin: 3500, nextMin: null };
  if (lifetime >= 2500) return { name: "Silver", currentMin: 2500, nextMin: 3500 };
  if (lifetime >= 1500) return { name: "Bronze", currentMin: 1500, nextMin: 2500 };
  return { name: "Member", currentMin: 0, nextMin: 1500 };
}

export default function RewardsPage() {
  const { getCustomerId } = useAuth();
  const [customerId, setCustomerId] = useState(null);
  useEffect(() => setCustomerId(getCustomerId()), [getCustomerId]);

  const { rewards, loading: catalogLoading, error: catalogError } = useRewardsCatalog(true);
  const {
    claims,
    loading: claimsLoading,
    error: claimsError,
    refresh: refreshClaims,
  } = useMyClaims(customerId);

const {
  balance: donatedPoints,
  loading: pointsLoading,
  error: pointsError,
  refresh: refreshPoints,
} = useLoyaltyBalance(customerId);


  const totalSpent = useMemo(
    () =>
      Array.isArray(claims)
        ? claims.reduce((s, c) => s + Number(c.pointsCost || 0), 0)
        : 0,
    [claims]
  );

  const currentPoints = Math.max((donatedPoints ?? 0) - totalSpent, 0);
  const lifetimePoints = donatedPoints ?? 0;

  const { name: tierName, currentMin, nextMin } = computeTier(lifetimePoints);
  const pointsToNext = nextMin ? Math.max(nextMin - lifetimePoints, 0) : 0;

  const progress = (() => {
    if (!nextMin) return 100;
    const span = nextMin - currentMin || 1;
    const pos = Math.min(Math.max(lifetimePoints - currentMin, 0), span);
    return Math.round((pos / span) * 100);
  })();

  /* =========================================
     ✅ StrictMode Duplicate-call Guard
     ========================================= */
  const claimingRef = useRef(false);

  async function handleClaim(reward) {
    if (!customerId) return;

    // Strict mode double-invocation protection
    if (claimingRef.current) return;
    claimingRef.current = true;

    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, rewardId: reward.id }),
      });

      const j = await res.json();

      // If second StrictMode-invoked call errors with balance issue → ignore
      if (!res.ok) {
        if (
          j?.Errors?.[0]?.includes("exceeds points balance") ||
          j?.error?.includes("exceeds points balance")
        ) {
          console.warn("Ignored duplicate redemption call caused by StrictMode.");
        } else {
          throw new Error(j?.error || "Redemption failed");
        }
      }

      await Promise.all([refreshPoints(), refreshClaims()]);
    } finally {
      // Allow next real claim
      claimingRef.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rewards</h1>
            <p className="text-muted-foreground mt-1">
              Redeem your points for exclusive rewards{" "}
              {customerId ? `(ID ${customerId})` : ""}
            </p>
          </div>

          {/* Balance & Tier */}
          <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <Star className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Your Points Balance
                    </p>
                    <p className="text-4xl font-bold text-foreground">
                      {pointsLoading
                        ? "…"
                        : (currentPoints || 0).toLocaleString()}
                    </p>
                    {pointsError && (
                      <p className="text-xs text-red-600 mt-1">
                        Failed to compute points from donations:{" "}
                        {String(pointsError.message || pointsError)}
                      </p>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">
                      Lifetime points (donated):{" "}
                      <span className="font-medium">
                        {(lifetimePoints || 0).toLocaleString()}
                      </span>
                      {" • "}
                      Spent:{" "}
                      <span className="font-medium">
                        {(totalSpent || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-md w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Progress to{" "}
                      {nextMin ? `${tierName === "Member" ? "Bronze" : tierName === "Bronze" ? "Silver" : "Gold"} Tier` : "Top Tier"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {pointsToNext.toLocaleString()} points to go
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{tierName} Tier</Badge>
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Tiers are based on lifetime points (total donated), not current balance
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Catalog */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rewards</CardTitle>
              <CardDescription>
                Choose from our selection of eco-friendly rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="p-6 text-sm text-muted-foreground">
                  Loading catalog…
                </div>
              ) : catalogError ? (
                <div className="p-6 text-sm text-red-600">
                  Failed to load catalog:{" "}
                  {String(catalogError.message || catalogError)}
                </div>
              ) : rewards.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      currentPoints={currentPoints}
                      onClaim={handleClaim}
                      claiming={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-sm text-muted-foreground border rounded-lg">
                  No rewards available right now.
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Claims */}
          <Card>
            <CardHeader>
              <CardTitle>My Claimed Rewards</CardTitle>
              <CardDescription>Everything you’ve redeemed so far</CardDescription>
            </CardHeader>
            <CardContent>
              {claimsLoading ? (
                <div className="p-6 text-sm text-muted-foreground">
                  Loading your claims…
                </div>
              ) : claimsError ? (
                <div className="p-6 text-sm text-red-600">
                  Failed to load claims:{" "}
                  {String(claimsError.message || claimsError)}
                </div>
              ) : (
                <ClaimsTable claims={claims} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
