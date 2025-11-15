import { NextResponse } from "next/server";

const BASE = process.env.DON_PREF_BASE_URL;
const USER = process.env.DON_PREF_USERNAME;
const PASS = process.env.DON_PREF_PASSWORD;

const authHeader =
  "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  if (!customerId)
    return NextResponse.json({ error: "Missing customerId" }, { status: 400 });

  const res = await fetch(
    `${BASE}/GetPreference?CustomerId=${customerId}`,
    {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await res.json();

  return NextResponse.json(data);
}
