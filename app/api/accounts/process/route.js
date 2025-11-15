// app/api/accounts/process/route.js
import { NextResponse } from "next/server";
import { txnCategoryStore } from "@/lib/txn-category-store"; 
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
        {
          success: false,
          error:
            "ProcessTransaction API is not configured (check PROCESS_TRANSACTION_* env vars).",
        },
        { status: 500 }
      );
    }

    // Your base ends with /rest/ProcessTxn
    // Swagger shows full endpoint: /rest/ProcessTxn/ProcessTxn
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
    const upstreamBody = isJson ? await upstreamRes.json() : await upstreamRes.text();

    if (!upstreamRes.ok) {
      const msg = isJson
        ? upstreamBody?.message || JSON.stringify(upstreamBody)
        : upstreamBody;
      return NextResponse.json(
        {
          success: false,
          error: msg || `Upstream error (${upstreamRes.status})`,
        },
        { status: upstreamRes.status }
      );
        }
        try {
    const tid = upstreamBody?.transactionId;
    const cat = upstreamBody?.MerchantCategory;
    if (tid && cat) {
        txnCategoryStore.set(String(tid), String(cat));
    }
    } catch (e) {
    console.warn("[process transaction] failed to store category", e);
    }
    // Example response:
    // {
    //   "transactionId": "0000420523",
    //   "CustomerId": "0000002754",
    //   "Cust_Acct_Id": "0000005953",
    //   "Recieving_Acct_Id": "0000005954",
    //   "txnAmt": 3.0,
    //   "MerchantCategory": "Transport"
    // }

    return NextResponse.json(
      {
        success: true,
        transaction: upstreamBody,
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
