import { NextResponse } from "next/server";
import { LoyaltyAPI } from "@/lib/loyalty-api";

export async function PUT(req) {
  try {
    const { customerId, amount, operation } = await req.json();
    if (!customerId || amount == null || !operation) {
      return NextResponse.json(
        { error: "customerId, amount and operation are required" },
        { status: 400 }
      );
    }
    // LoyaltyAPI will normalize ADD/DEDUCT -> INCREASE/REDUCE
    const data = await LoyaltyAPI.updatePoints({ customerId, amount, operation });
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
