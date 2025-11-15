// app/api/preferences/route.js
import { NextResponse } from "next/server";
import { DonationPrefAPI } from "@/lib/donation-pref-api";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) return NextResponse.json(null, { status: 200 });

  try {
    const pref = await DonationPrefAPI.get(customerId);
    return NextResponse.json(pref || null, { status: 200 });
  } catch (err) {
    console.error("GET /preferences error:", err);
    return NextResponse.json(null, { status: 200 });
  }
}
