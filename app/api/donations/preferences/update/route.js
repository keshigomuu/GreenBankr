import { NextResponse } from "next/server";
import { DonationPrefAPI } from "@/lib/donation-pref-api";

export async function PUT(req) {
  try {
    const body = await req.json();
    const resp = await DonationPrefAPI.update(body);
    return NextResponse.json({ success: true, data: resp });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
