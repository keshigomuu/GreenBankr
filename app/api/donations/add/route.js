import { NextResponse } from "next/server";
import { DonationsAPI } from "@/lib/donations-api";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { customerId, amount, orgId } = await req.json();

    if (!customerId || amount == null || orgId == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await DonationsAPI.addDonation({ customerId, amount, orgId });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
