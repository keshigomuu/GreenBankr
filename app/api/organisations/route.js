import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const base = process.env.ORGANISATIONS_BASE_URL; // e.g. https://kxl.outsystemscloud.com/OrganisationInfo/rest/OrganisationService
    const apiKey = process.env.ORGANISATIONS_API_KEY;
    const apiKeyHeader =
      process.env.ORGANISATIONS_API_KEY_HEADER || "X-Contacts-Key";

    if (!base || !apiKey) {
      throw new Error(
        "Missing ORGANISATIONS_BASE_URL or ORGANISATIONS_API_KEY env vars"
      );
    }

    const url = `${base}/GetAllOrganisations`;

    const headers = {
      "Content-Type": "application/json",
    };

    // Add API key header
    headers[apiKeyHeader] = apiKey;

    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    const raw = await res.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }

    if (!res.ok) {
      const msg =
        (data && data.error) ||
        (Array.isArray(data?.Errors) && data.Errors[0]) ||
        `GetAllOrganisations failed (status ${res.status})`;
      throw new Error(msg);
    }

    if (!Array.isArray(data)) {
      throw new Error("Unexpected organisations response shape");
    }

    return NextResponse.json({ organisations: data }, { status: 200 });
  } catch (err) {
    console.error("[organisations] GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load organisations" },
      { status: 500 }
    );
  }
}