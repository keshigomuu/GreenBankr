// app/api/account/transactions/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!accountId || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing accountId, startDate or endDate",
        },
        { status: 400 }
      );
    }

    // Env vars from .env.local
    const baseRaw =
      process.env.ACCOUNT_API_BASE_URL || process.env.ACCOUNT_BASE_URL || "";
    const username =
      process.env.ACCOUNT_API_USERNAME ||
      process.env.ACCOUNT_USERNAME ||
      "";
    const password =
      process.env.ACCOUNT_API_PASSWORD ||
      process.env.ACCOUNT_PASSWORD ||
      "";

    if (!baseRaw || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Account API is not configured on the server",
        },
        { status: 500 }
      );
    }

    // Normalise base so we don't accidentally get /account/account/...
    const normalizedBase = baseRaw.replace(/\/$/, "");
    const accountBase = normalizedBase.endsWith("/account")
      ? normalizedBase
      : `${normalizedBase}/account`;

    // Hardcode PageNo & PageSize as requested
    const upstreamUrl = `${accountBase}/${encodeURIComponent(
      accountId
    )}/transactions?PageNo=1&PageSize=50&StartDate=${encodeURIComponent(
      startDate
    )}&EndDate=${encodeURIComponent(endDate)}`;

    const authHeader =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

    const upstreamRes = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    const ct = upstreamRes.headers.get("content-type") || "";
    const isJson = ct.toLowerCase().includes("application/json");
    const body = isJson ? await upstreamRes.json() : await upstreamRes.text();

    if (!upstreamRes.ok) {
      const msg = isJson
        ? body?.message || JSON.stringify(body)
        : body || "Upstream error";
      return NextResponse.json(
        { success: false, error: msg },
        { status: 502 }
      );
    }

    // Expect array of transactions
    const list = Array.isArray(body) ? body : [];

    return NextResponse.json(
      {
        success: true,
        transactions: list,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[transactions] error", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
