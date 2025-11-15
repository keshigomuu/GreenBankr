// app/api/accounts/withdraw/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function buildAuthHeader() {
  const user = process.env.ACCOUNT_API_USERNAME;
  const pass = process.env.ACCOUNT_API_PASSWORD;

  if (!user || !pass) {
    throw new Error("ACCOUNT_API_USERNAME / ACCOUNT_API_PASSWORD not set");
  }

  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerId, accountId, amount, narrative } = body || {};

    if (!customerId || !accountId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "customerId, accountId and amount are required",
        },
        { status: 400 }
      );
    }

    const base = process.env.ACCOUNT_BASE_URL;
    if (!base) {
      return NextResponse.json(
        { success: false, error: "ACCOUNT_BASE_URL not configured" },
        { status: 500 }
      );
    }

    const url = `${base.replace(
      /\/$/,
      ""
    )}/account/${encodeURIComponent(customerId)}/WithdrawCash`;

    const upstreamRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: buildAuthHeader(),
      },
      body: JSON.stringify({
        accountId: String(accountId),
        amount: Number(amount),
        narrative: narrative || "Withdrawal via GreenBankr",
      }),
    });

    const ct = upstreamRes.headers.get("content-type") || "";
    const isJson = ct.toLowerCase().includes("application/json");
    const upstreamBody = isJson ? await upstreamRes.json() : await upstreamRes.text();

    if (!upstreamRes.ok) {
      const msg = isJson
        ? upstreamBody?.message || JSON.stringify(upstreamBody)
        : upstreamBody;
      return NextResponse.json(
        {
          success: false,
          error: msg || `WithdrawCash error (${upstreamRes.status})`,
        },
        { status: upstreamRes.status }
      );
    }

    // upstreamBody: { balanceAfter, balanceBefore, transactionId }
    return NextResponse.json(
      {
        success: true,
        result: {
          ...upstreamBody,
          category: "Withdrawal",
          paymentMode: "Digital",
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[WithdrawCash] error", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
