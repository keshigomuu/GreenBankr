import { NextResponse } from "next/server";
import { DonationsAPI } from "@/lib/donations-api";

export async function GET() {
  try {
    const rows = await DonationsAPI.getAll();
    return NextResponse.json({ donations: rows }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
