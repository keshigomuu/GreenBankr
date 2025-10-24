import { NextResponse } from "next/server";
import { DonationsAPI } from "@/lib/donations-api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerIdRaw = searchParams.get("customerId");
    if (customerIdRaw == null) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    const customerId = parseInt(String(customerIdRaw), 10);
    if (!Number.isFinite(customerId) || customerId <= 0) {
      return NextResponse.json(
        { error: "customerId must be a positive integer" },
        { status: 400 }
      );
    }

    const rows = await DonationsAPI.getByCustomer(customerId);
    return NextResponse.json({ donations: rows }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
