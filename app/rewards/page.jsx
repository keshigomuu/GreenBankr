"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Zap } from "lucide-react";
import RewardCard from "@/components/rewards/RewardCard";
import ClaimsTable from "@/components/rewards/ClaimsTable";
import { ensureCustomerId } from "@/lib/utils";
import { useRewardsCatalog, useMyClaims, useClaimReward } from "@/hooks/useRewards";

export default function RewardsPage() {
  const currentPoints = 2450;
  const nextTierPoints = 3000;
  const progress = (currentPoints / nextTierPoints) * 100;

  const [customerId, setCustomerId] = useState(null);
  useEffect(() => setCustomerId(ensureCustomerId()), []);

  const { rewards, loading: catalogLoading, error: catalogError } = useRewardsCatalog(true);
  const { claims, loading: claimsLoading, error: claimsError } = useMyClaims(customerId);
  const { claim, loading: claimLoading } = useClaimReward();

  const claimingDisabled = useMemo(() => claimLoading || !customerId, [claimLoading, customerId]);

  async function handleClaim(reward) {
    if (!customerId) return;
    await claim({ customerId, rewardId: reward.id });
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rewards</h1>
            <p className="text-muted-foreground mt-1">Redeem your points for exclusive rewards</p>
          </div>

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
                    <span className="text-sm text-muted-foreground">
                      {nextTierPoints - currentPoints} points to go
                    </span>
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

          <Card>
            <CardHeader>
              <CardTitle>Available Rewards</CardTitle>
              <CardDescription>Choose from our selection of eco-friendly rewards</CardDescription>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading catalog…</div>
              ) : catalogError ? (
                <div className="p-6 text-sm text-red-600">
                  Failed to load catalog: {String(catalogError.message || catalogError)}
                </div>
              ) : rewards.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      currentPoints={currentPoints}
                      onClaim={!claimingDisabled ? handleClaim : undefined}
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

          <Card>
            <CardHeader>
              <CardTitle>My Claimed Rewards</CardTitle>
              <CardDescription>Everything you’ve redeemed so far</CardDescription>
            </CardHeader>
            <CardContent>
              {claimsLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading your claims…</div>
              ) : claimsError ? (
                <div className="p-6 text-sm text-red-600">
                  Failed to load claims: {String(claimsError.message || claimsError)}
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
