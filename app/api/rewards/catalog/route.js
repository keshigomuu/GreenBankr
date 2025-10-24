import { NextResponse } from "next/server";
import { RewardsAPI } from "@/lib/rewards-api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");
    const useActive = active === null ? true : active === "true";
    const data = await RewardsAPI.getCatalog(useActive);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
