// app/api/accounts/orchestrate/route.js

import { NextResponse } from "next/server";

// --- APIs (your existing client wrappers) ---
import { OrchestrationAPI } from "@/lib/orchestration-api";
import { AccountAPI } from "@/lib/account-api";
import { ImpactAPI } from "@/lib/impact-api";
import { LoyaltyAPI } from "@/lib/loyalty-api";
import { DonationsAPI } from "@/lib/donations-api";
import { DonationPrefAPI } from "@/lib/donation-pref-api";

/**
 * BODY RECEIVED FROM FRONTEND:
 * {
 *   customerId: "0000002754",
 *   custAccountId: "123456",
 *   receivingAccountId: "987654",
 *   amount: 12,
 *   category: "Transport",
 *   makeDonation: true | false
 * }
 */

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      customerId,
      custAccountId,
      receivingAccountId,
      amount,
      category,
      makeDonation,
    } = body;

    // --------------------------------------------
    // 1. CALL ORCHESTRATION SERVICE
    // --------------------------------------------
    const orchestrationResult = await OrchestrationAPI.run({
      CustomerId: customerId,
      Cust_Acct_Id: custAccountId,
      Recieving_Acct_Id: receivingAccountId,
      txnAmt: amount,
      MerchantCategory: category,
    });

    if (!orchestrationResult?.Success) {
      throw new Error("Orchestration service failed.");
    }

    const pointsEarned = orchestrationResult.PointsEarned || 0;
    const donationAmount = orchestrationResult.DonationAmount || 0;
    const carbonObj = orchestrationResult.CarbonImpact || null;

    // --------------------------------------------
    // 2. UPDATE LOYALTY POINTS
    // --------------------------------------------
    let updatedPoints = null;
    try {
      const loyaltyResp = await LoyaltyAPI.addPoints({
        customerId,
        points: pointsEarned,
      });
      updatedPoints = loyaltyResp?.newTotalPoints || 0;
    } catch (err) {
      console.warn("Loyalty update failed but continuing:", err);
    }

    // --------------------------------------------
    // 3. CREATE CARBON IMPACT RECORD
    // --------------------------------------------
    let carbonList = [];
    try {
      if (carbonObj) {
        await ImpactAPI.create({
          customerId,
          amount: carbonObj.TxnAmt,
          category: carbonObj.MerchantCategory,
          carbonKg: carbonObj.CarbonKg,
        });
      }

      const carbonResp = await ImpactAPI.getByCustomer(customerId);
      carbonList = carbonResp?.records || [];
    } catch (err) {
      console.warn("Carbon impact update failed:", err);
    }

    // --------------------------------------------
    // 4. IF USER ENABLED DONATION → CREATE DONATION
    // --------------------------------------------
    if (makeDonation) {
      try {
        // Get user preference to know which organisation to donate to
        const pref = await DonationPrefAPI.get({ customerId });
        const orgName = pref?.Organization || null;

        if (orgName && donationAmount > 0) {
          await DonationsAPI.addDonation({
            customerId,
            orgName,
            amount: donationAmount,
          });
        }
      } catch (err) {
        console.warn("Donation creation failed:", err);
      }
    }

    // --------------------------------------------
    // 5. REFRESH DONATION HISTORY
    // --------------------------------------------
    let donationHistory = [];
    try {
      const donationResp = await DonationsAPI.getByCustomer(customerId);
      donationHistory = donationResp?.donations || [];
    } catch (err) {
      console.warn("Donation history fetch failed:", err);
    }

    // --------------------------------------------
    // 6. REFRESH ACCOUNT BALANCE
    // --------------------------------------------
    let newBalance = 0;
    try {
      const balResp = await AccountAPI.getDepositBalance({
        accountId: custAccountId,
      });
      newBalance = balResp?.balance || 0;
    } catch (err) {
      console.warn("Balance fetch failed:", err);
    }

    // --------------------------------------------
    // 7. FINAL RESPONSE TO FRONTEND
    // --------------------------------------------
    return NextResponse.json(
      {
        success: true,
        balance: newBalance,
        points: updatedPoints,
        carbon: carbonList,
        donations: donationHistory,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("ORCHESTRATION ROUTE ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
