import { NextResponse } from "next/server";
import { CarbonAPI } from "@/lib/carbon-api";

export async function POST(req) {
  try {
    const { userId, merchantCategory, amount } = await req.json();

    if (!userId || !String(userId).trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!merchantCategory || !String(merchantCategory).trim()) {
      return NextResponse.json({ error: "merchantCategory is required" }, { status: 400 });
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    const res = await CarbonAPI.createImpact({ userId, merchantCategory, amount: n });
    return NextResponse.json(res, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
