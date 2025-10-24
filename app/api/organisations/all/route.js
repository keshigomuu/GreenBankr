import { NextResponse } from "next/server";
import { OrganisationsAPI } from "@/lib/organisations-api";

export async function GET() {
  try {
    const orgs = await OrganisationsAPI.getAll();
    return NextResponse.json({ organisations: orgs }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
