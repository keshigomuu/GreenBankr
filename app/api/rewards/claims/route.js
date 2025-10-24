import { NextResponse } from "next/server";
import { RewardsAPI } from "@/lib/rewards-api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }
    const data = await RewardsAPI.listClaims(customerId);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
