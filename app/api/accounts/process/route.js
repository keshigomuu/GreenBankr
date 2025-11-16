import { NextResponse } from "next/server";
import { txnCategoryStore } from "@/lib/txn-category-store";
import { runOrchestration } from "@/lib/orchestration-api";

export async function POST(req) {
  try {
    const body = await req.json();
    const { customerId, custAcctId, receivingAcctId, amount, category } = body || {};

    if (!customerId || !custAcctId || !receivingAcctId || !amount || !category) {
      return NextResponse.json({
        success: false,
        error:
          "Missing one or more required fields: customerId, custAcctId, receivingAcctId, amount, category",
      });
    }

    // ========= ORCHESTRATION ONLY (NO ProcessTxn / Donation / Loyalty) =========
    let orchestration;
    try {
      orchestration = await runOrchestration({
        customerId,
        custAcctId,
        receivingAcctId,
        amount,
        category,
      });
    } catch (err) {
      return NextResponse.json(
        { success: false, error: err?.message || "Orchestration failed" },
        { status: 502 }
      );
    }

    // Treat orchestration result as the "transaction body" for local UI storage.
    const transactionBody = {
      TransactionId: orchestration.transactionId,
      TransactionAmount: orchestration.transactionAmount,
      TotalPointsEarned: orchestration.totalPointsEarned,
      CarbonIntensity: orchestration.carbonIntensity,
      NotificationStatus: orchestration.notificationStatus,
    };

    // Store local category keyed by TransactionId (from orchestration)
    try {
      const tid = orchestration.transactionId;
      if (tid && category) txnCategoryStore.set(String(tid), String(category));
    } catch (err) {}

    return NextResponse.json(
      {
        success: true,
        transaction: transactionBody,
        orchestration,
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
