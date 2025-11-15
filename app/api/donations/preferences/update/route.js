import { NextResponse } from "next/server";

const BASE = process.env.DON_PREF_BASE_URL;
const USER = process.env.DON_PREF_USERNAME;
const PASS = process.env.DON_PREF_PASSWORD;

const authHeader =
  "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

export async function PUT(req) {
  const body = await req.json();

  const res = await fetch(`${BASE}/UpdatePreference`, {
    method: "PUT",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerId: body.customerId,
      preference: body.preference,
      organization: body.preference,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
