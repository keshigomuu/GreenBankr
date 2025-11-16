import { NextResponse } from "next/server";
import { txnCategoryStore } from "@/lib/txn-category-store";
import { runOrchestration } from "@/lib/orchestration-api";
import { DonationsAPI } from "@/lib/donations-api";
import { LoyaltyAPI } from "@/lib/loyalty-api";
import { getOrganisationPreference } from "@/lib/organisations-api"; // 👈 ADD THIS

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      customerId,
      custAcctId,
      receivingAcctId,
      amount,
      category,
      makeDonation = false,
    } = body || {};

    if (!customerId || !custAcctId || !receivingAcctId || !amount || !category) {
      return NextResponse.json({
        success: false,
        error:
          "Missing one or more required fields: customerId, custAcctId, receivingAcctId, amount, category",
      });
    }

    // ========= PROCESS TRANSACTION (UNCHANGED) =========
    const base = process.env.PROCESS_TRANSACTION_BASE_URL;
    const apiKey = process.env.PROCESS_TRANSACTION_API_KEY;
    const apiKeyHeader = process.env.PROCESS_TRANSACTION_API_KEY_HEADER;

    const upstreamRes = await fetch(base + "/ProcessTxn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        [apiKeyHeader]: apiKey,
      },
      body: JSON.stringify({
        CustomerId: customerId,
        Cust_Acct_Id: custAcctId,
        Recieving_Acct_Id: receivingAcctId,
        txnAmt: Number(amount),
        MerchantCategory: category,
      }),
    });

    const transactionBody = await upstreamRes.json();

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { success: false, error: transactionBody },
        { status: upstreamRes.status }
      );
    }

    // Store local category for your UI
    try {
      const tid = transactionBody.TransactionId;
      if (tid && category) txnCategoryStore.set(String(tid), String(category));
    } catch (err) {}

    // ========= CALL ORCHESTRATION SERVICE =========
    let orchestration = null;
    try {
      orchestration = await runOrchestration({
        customerId,
        custAcctId,
        receivingAcctId,
        amount,
        category,
      });
    } catch (err) {
      orchestration = null;
    }

    // ========== HANDLE DONATION LOGIC ==========
    let donationRecord = null;
    let loyaltyRecord = null;

    if (makeDonation && orchestration?.transactionAmount > 0) {
      // 1️⃣ Get user preferred organisation
      let preferredOrg = null;
      try {
        preferredOrg = await getOrganisationPreference(customerId);
      } catch (err) {
        preferredOrg = null;
      }

      // 2️⃣ Determine actual organisation ID for donation
      // Preferred organisation → real Org_ID
      // No preference → null (Sustainability Fund)
      const resolvedOrgId = preferredOrg?.preferredOrgId || null;

      // 3️⃣ Create donation entry
      try {
        donationRecord = await DonationsAPI.addDonation({
          customerId,
          amount: orchestration.transactionAmount,
          orgId: resolvedOrgId,        // 👈 NULL means Sustainability Fund
        });
      } catch (err) {}

      // 4️⃣ Add loyalty points
      try {
        loyaltyRecord = await LoyaltyAPI.updatePoints({
          customerId,
          amount: orchestration.totalPointsEarned,
          operation: "INCREASE",
        });
      } catch (err) {}
    }

    // ========= RETURN FINAL RESPONSE =========
    return NextResponse.json(
      {
        success: true,
        transaction: transactionBody,
        orchestration,
        donation: donationRecord,
        loyalty: loyaltyRecord,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
