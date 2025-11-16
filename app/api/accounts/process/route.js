// app/api/accounts/process/route.js
import { NextResponse } from "next/server";
import { txnCategoryStore } from "@/lib/txn-category-store";
import { runOrchestration } from "@/lib/orchestration-api";
import { DonationsAPI } from "@/lib/donations-api";
import { LoyaltyAPI } from "@/lib/loyalty-api";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      customerId,
      custAcctId,
      receivingAcctId,
      amount,
      category,
      makeDonation = false, // 👈 NEW
      orgId,                // 👈 Needed for DonationsAPI
    } = body || {};

    if (!customerId || !custAcctId || !receivingAcctId || !amount || !category) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing one or more required fields: customerId, custAcctId, receivingAcctId, amount, category",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // 1️⃣ PROCESS TRANSACTION via TBANK
    // ------------------------------------------------------------
    const base =
      process.env.PROCESS_TRANSACTION_BASE_URL ||
      process.env.PROCESS_TXN_BASE_URL ||
      "";
    const apiKey =
      process.env.PROCESS_TRANSACTION_API_KEY ||
      process.env.PROCESS_TXN_API_KEY ||
      "";
    const apiKeyHeader =
      process.env.PROCESS_TRANSACTION_API_KEY_HEADER ||
      process.env.PROCESS_TXN_API_KEY_HEADER ||
      "X-API-Key";

    if (!base || !apiKey) {
      return NextResponse.json(
        { success: false, error: "ProcessTransaction API not configured" },
        { status: 500 }
      );
    }

    const url = `${base.replace(/\/$/, "")}/ProcessTxn`;

    const payload = {
      CustomerId: String(customerId),
      Cust_Acct_Id: String(custAcctId),
      Recieving_Acct_Id: String(receivingAcctId),
      txnAmt: Number(amount),
      MerchantCategory: String(category),
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      [apiKeyHeader]: apiKey,
    };

    const upstreamRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const ct = upstreamRes.headers.get("content-type") || "";
    const isJson = ct.toLowerCase().includes("application/json");
    const upstreamBody = isJson
      ? await upstreamRes.json()
      : await upstreamRes.text();

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, error: upstreamBody },
        { status: upstreamRes.status }
      );
    }

    // Store category for history
    try {
      const tid =
        upstreamBody?.transactionId ||
        upstreamBody?.TransactionId ||
        upstreamBody?.TransactionID;
      const cat = upstreamBody?.MerchantCategory || category;
      if (tid && cat) txnCategoryStore.set(String(tid), String(cat));
    } catch (e) {
      console.warn("[process transaction] failed to store category", e);
    }

    // ------------------------------------------------------------
    // 2️⃣ CALL ORCHESTRATION SERVICE
    // ------------------------------------------------------------
    let orchestration = null;
    try {
      orchestration = await runOrchestration({
        customerId,
        custAcctId,
        receivingAcctId,
        amount,
        category,
        makeDonation,
      });
    } catch (e) {
      console.warn("[Orchestration] failed — continuing", e);
      orchestration = null;
    }

    // If orchestration didn’t run, return early (but still successful)
    if (!orchestration) {
      return NextResponse.json(
        {
          success: true,
          transaction: upstreamBody,
          orchestration: null,
        },
        { status: 200 }
      );
    }

    // ------------------------------------------------------------
    // 3️⃣ CREATE DONATION RECORD (if required)
    // ------------------------------------------------------------
    let donationRecord = null;
    if (makeDonation && orchestration.transactionAmount > 0) {
      try {
        // You MUST supply orgId from frontend
        donationRecord = await DonationsAPI.addDonation({
          customerId,
          amount: orchestration.transactionAmount,
          orgId,
        });
      } catch (e) {
        console.warn("[Donations] failed:", e);
      }
    }

    // ------------------------------------------------------------
    // 4️⃣ APPLY LOYALTY POINTS
    // ------------------------------------------------------------
    let loyaltyUpdate = null;
    if (orchestration.totalPointsEarned > 0) {
      try {
        loyaltyUpdate = await LoyaltyAPI.updatePoints({
          customerId,
          amount: orchestration.totalPointsEarned,
          operation: "INCREASE",
        });
      } catch (e) {
        console.warn("[Loyalty] failed:", e);
      }
    }

    // ------------------------------------------------------------
    // 5️⃣ RETURN ALL RESULTS TO FRONTEND
    // ------------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        transaction: upstreamBody,
        orchestration,
        donation: donationRecord,
        loyalty: loyaltyUpdate,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[process transaction] error", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
