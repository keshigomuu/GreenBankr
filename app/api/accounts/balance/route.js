import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const accountId = searchParams.get("accountId");

    if (!customerId || !accountId) {
      return NextResponse.json(
        { success: false, error: "customerId and accountId are required" },
        { status: 400 }
      );
    }

    const base = process.env.ACCOUNT_BASE_URL;
    const user = process.env.ACCOUNT_API_USERNAME;
    const pass = process.env.ACCOUNT_API_PASSWORD;

    if (!base || !user || !pass) {
      return NextResponse.json(
        {
          success: false,
          error: "Account API environment variables are not configured",
        },
        { status: 500 }
      );
    }

    const url = `${base}/account/${customerId}/${accountId}/balance`;
    const auth = Buffer.from(`${user}:${pass}`).toString("base64");

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Upstream SMUtBank error",
          status: upstream.status,
          body: text,
        },
        { status: upstream.status }
      );
    }

    let json;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text };
    }

    const balance = json?.balance ?? 0;

    return NextResponse.json({
      success: true,
      balance,
      raw: json,
    });
  } catch (err) {
    console.error("[accounts/balance] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
