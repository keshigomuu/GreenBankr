import { NextResponse } from "next/server";
import { DonationPrefAPI } from "@/lib/donation-pref-api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId)
      return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

    const pref = await DonationPrefAPI.get(customerId);
    return NextResponse.json({ preference: pref || null });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Error fetching preference" },
      { status: 500 }
    );
  }
}
