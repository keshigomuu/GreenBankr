import { NextResponse } from "next/server";
import { RewardsAPI } from "@/lib/rewards-api";
import { LoyaltyAPI } from "@/lib/loyalty-api";

export async function POST(req) {
  try {
    const { customerId, rewardId } = await req.json();
    if (!customerId || !rewardId) {
      return NextResponse.json({ error: "customerId and rewardId are required" }, { status: 400 });
    }

    // 1) Get active catalog and find the reward cost
    const { rewards } = await RewardsAPI.getCatalog(true);
    const reward = rewards.find((r) => String(r.id) === String(rewardId));
    if (!reward) {
      return NextResponse.json({ error: "Reward not found or inactive" }, { status: 404 });
    }

    // 2) Claim in Rewards service
    const { claimId } = await RewardsAPI.claimReward(customerId, rewardId);
    if (!claimId) {
      return NextResponse.json({ error: "Claim failed" }, { status: 502 });
    }

    // 3) Deduct points in Loyalty service (operation must be REDUCE)
    const deduction = Number(reward.points || 0);
    const result = await LoyaltyAPI.updatePoints({
      customerId,
      amount: deduction,
      operation: "REDUCE",
    });

    return NextResponse.json(
      {
        claimId,
        deducted: deduction,
        pointsBefore: result.pointsBefore,
        pointsAfter: result.pointsAfter,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
