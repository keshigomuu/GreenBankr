import { NextResponse } from "next/server";
import { CarbonAPI } from "@/lib/carbon-api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId || !String(userId).trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const data = await CarbonAPI.getImpactByUser(userId);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
