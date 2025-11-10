import { NextResponse } from "next/server";
import { DonationsAPI } from "@/lib/donations-api";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json({ error: "Missing customerId" }, { status: 400 });
    }

    const donations = await DonationsAPI.getByCustomer(customerId);
    // Normal success
    return NextResponse.json({ donations }, { status: 200 });
  } catch (err) {
    // Graceful fallback for “no data” → return empty list
    const msg = String(err?.message || "");
    const noData =
      /no donations|no record|not found|empty/i.test(msg) ||
      msg.includes("GetDonation failed (404)") ||
      msg.includes("GetDonation failed (500)") ||
      msg.includes("GetDonation failed (204)");

    if (noData) {
      return NextResponse.json({ donations: [] }, { status: 200 });
    }

    // Real error
    return NextResponse.json({ error: msg || "Server error" }, { status: 500 });
  }
}
