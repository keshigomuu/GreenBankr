import { NextResponse } from "next/server";
import { TransactionsAPI } from "@/lib/transactions-api";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

    const txns = await TransactionsAPI.listByCustomer(customerId);
    return NextResponse.json({ transactions: txns }, { status: 200 });
  } catch (err) {
    const msg = String(err?.message || "");
    // Gracefully treat "no data" as empty
    if (/no data|not found|empty/i.test(msg)) {
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }
    return NextResponse.json({ error: msg || "Server error" }, { status: 500 });
  }
}
