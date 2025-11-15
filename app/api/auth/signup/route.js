import { NextResponse } from "next/server";
import { createCustomer } from "@/lib/customer-onboarding-api";

export const runtime = "nodejs";

export async function POST(req) {
  console.log("[signup] 🎯 Starting customer signup process...");

  try {
    const body = await req.json();
    console.log("[signup] 📥 Received form data keys:", Object.keys(body));

    // Validate required fields (tenantId & customerType are hard-coded in the lib)
    const requiredFields = [
      { key: "icNumber", value: body.icNumber },
      { key: "givenName", value: body.givenName },
      { key: "familyName", value: body.familyName },
      { key: "emailAddress", value: body.emailAddress },
      { key: "mobileNumber", value: body.mobileNumber },
      { key: "preferredUserld", value: body.preferredUserld },
      { key: "password", value: body.password },
    ];

    for (const field of requiredFields) {
      if (!field.value?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: `${field.key} is required`,
          },
          { status: 400 }
        );
      }
    }

    // Map frontend form to API payload with proper data types
    const customerData = {
      // Identity
      icNumber: body.icNumber?.trim().toUpperCase() || "",
      familyName: body.familyName?.trim() || "",
      givenName: body.givenName?.trim() || "",
      dateOfBirth: body.dateOfBirth || "2014-12-31",
      gender: body.gender?.trim() || "",

      // Contact
      emailAddress: body.emailAddress?.trim() || "",
      countryCode: body.countryCode?.trim() || "",
      mobileNumber: body.mobileNumber?.trim() || "",
      phoneCountryCode: body.phoneCountryCode?.trim() || "65",

      // Account
      // NOTE: composite service expects preferredUserld (lowercase L)
      preferredUserld: body.preferredUserld?.trim() || "",
      currency: body.currency?.trim() || "SGD",
      password: body.password || "",

      // Financial
      annualSalary: parseInt(body.annualSalary) || 15000,

      // Donation preferences
      Preference: Boolean(body.Preference),
      DonationOrg: body.DonationOrg?.trim() || "",
    };

    console.log("[signup] 📤 Calling customer creation API...");
    console.log("[signup] 📤 Customer data prepared (summary):", {
      icNumber: customerData.icNumber,
      name: `${customerData.givenName} ${customerData.familyName}`,
      email: customerData.emailAddress,
      preferredUserld: customerData.preferredUserld,
    });

    // This call hard-codes tenantId = "600" and customerType = "100"
    const result = await createCustomer(customerData);

    console.log("[signup] ✅ Customer created successfully:", {
      customerID: result?.CustomerID,
      depositeAcct: result?.DepositeAcct, // NOTE: service returns "DepositeAcct"
      loyaltyPts: result?.LoyaltyPts,
    });

    const customerId = result?.CustomerID || result?.customerId;
    if (!customerId) {
      throw new Error("Customer created but no CustomerID returned");
    }

    const depositAccount = result?.DepositeAcct || ""; // <-- accountId / deposit account

    return NextResponse.json({
      success: true,
      message: "Customer account created successfully",
      user: {
        customerId,
        icNumber: customerData.icNumber,
        givenName: customerData.givenName,
        familyName: customerData.familyName,
        email: customerData.emailAddress,
        phone: `${customerData.phoneCountryCode} ${customerData.phoneLocalNumber}`,
        depositAccount,
        loyaltyPoints: result?.LoyaltyPts || 0,
        raw: result,
      },
    });
  } catch (error) {
    console.error("[signup] ❌ Signup failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Customer creation failed",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
