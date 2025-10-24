"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, ShoppingBag, Coffee, Ticket, Trophy, Star } from "lucide-react";

const ICONS = { Gift, ShoppingBag, Coffee, Ticket, Trophy, Star };

export default function RewardCard({ reward, currentPoints, onClaim }) {
  const Icon = ICONS[reward.icon] || Gift;
  const canAfford = currentPoints >= (reward.points || 0);
  const available = reward.active !== false && (reward.stockAvailable ?? 1) > 0;

  return (
    <div
      className={`p-4 rounded-lg border transition-colors ${
        available && canAfford
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${available && canAfford ? "bg-primary/20" : "bg-muted"}`}>
          <Icon className={`${available && canAfford ? "text-primary" : "text-muted-foreground"} w-6 h-6`} />
        </div>
        <Badge variant={available ? "default" : "secondary"}>{reward.points} pts</Badge>
      </div>

      <h3 className="font-semibold text-foreground mb-1">{reward.name}</h3>
      <p className="text-sm text-muted-foreground mb-3">{reward.description}</p>
      <span className="inline-block px-2 py-1 rounded-full bg-muted text-xs font-medium mb-3">
        {reward.category || "Other"}
      </span>

      <Button
        className="w-full"
        disabled={!available || !canAfford}
        variant={available && canAfford ? "default" : "outline"}
        onClick={() => onClaim?.(reward)}
      >
        {!available
          ? "Unavailable"
          : !canAfford
          ? `Need ${(reward.points || 0) - currentPoints} more points`
          : "Redeem Now"}
      </Button>
    </div>
  );
}
