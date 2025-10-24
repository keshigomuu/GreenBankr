import { NextResponse } from "next/server";
import { DonationsAPI } from "@/lib/donations-api";

export async function POST(req) {
  try {
    const { customerId: customerIdRaw, amount: amountRaw, orgId: orgIdRaw } = await req.json();

    const customerId = parseInt(String(customerIdRaw), 10);
    const orgId = parseInt(String(orgIdRaw), 10);
    const amount = Number(amountRaw);

    if (!Number.isFinite(customerId) || customerId <= 0) {
      return NextResponse.json({ error: "customerId must be a positive integer" }, { status: 400 });
    }
    if (!Number.isFinite(orgId) || orgId <= 0) {
      return NextResponse.json({ error: "orgId must be a positive integer" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    const result = await DonationsAPI.addDonation({ customerId, amount, orgId });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
