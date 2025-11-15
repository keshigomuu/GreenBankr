// app/api/preferences/add/route.js
import { NextResponse } from "next/server";
import { DonationPrefAPI } from "@/lib/donation-pref-api";

export async function POST(req) {
  try {
    const body = await req.json();
    const result = await DonationPrefAPI.add(body);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Add Preference failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to add preference" },
      { status: 500 }
    );
  }
}
