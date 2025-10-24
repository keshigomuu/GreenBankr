import { NextResponse } from "next/server";
import { RewardsAPI } from "@/lib/rewards-api";

export async function POST(req) {
  try {
    const { customerId, rewardId } = await req.json();
    if (!customerId || !rewardId) {
      return NextResponse.json({ error: "customerId and rewardId are required" }, { status: 400 });
    }
    const data = await RewardsAPI.claimReward(customerId, rewardId);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
