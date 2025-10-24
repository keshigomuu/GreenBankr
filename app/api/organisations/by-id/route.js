import { NextResponse } from "next/server";
import { OrganisationsAPI } from "@/lib/organisations-api";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idRaw = searchParams.get("id");
    const id = parseInt(String(idRaw), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "id must be a positive integer" }, { status: 400 });
    }
    const org = await OrganisationsAPI.getById(id);
    return NextResponse.json(org, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
