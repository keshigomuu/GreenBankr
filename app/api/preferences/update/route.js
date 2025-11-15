// app/api/preferences/update/route.js
import { NextResponse } from "next/server";
import { DonationPrefAPI } from "@/lib/donation-pref-api";

export async function PUT(req) {
  try {
    const body = await req.json();
    const result = await DonationPrefAPI.update(body);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Update Preference failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update preference" },
      { status: 500 }
    );
  }
}
