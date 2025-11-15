import { NextResponse } from "next/server";

// Force Node runtime (good for Buffer & server-only envs)
export const runtime = "nodejs";

// Simple masker so we don't leak PII unless explicitly allowed
function maskValue(v) {
  if (!v || typeof v !== "string") return v;
  if (v.includes("@")) return v.replace(/(.).+(@.+)/, "$1***$2"); // email
  return v.length <= 4 ? "***" : v.slice(0, 2) + "***" + v.slice(-2);
}

function buildMasked(raw) {
  try {
    const copy = JSON.parse(JSON.stringify(raw));
    if (copy?.profile?.email) copy.profile.email = maskValue(copy.profile.email);
    if (copy?.cellphone?.phoneNumber)
      copy.cellphone.phoneNumber = maskValue(copy.cellphone.phoneNumber);
    if (copy?.phone?.localNumber) copy.phone.localNumber = maskValue(copy.phone.localNumber);
    if (copy?.certificate?.certificateNo)
      copy.certificate.certificateNo = maskValue(copy.certificate.certificateNo);
    if (copy?.taxIdentifier) copy.taxIdentifier = maskValue(copy.taxIdentifier);
    return copy;
  } catch {
    return raw;
  }
}

export async function POST(req) {
  try {
    const { icNumber } = await req.json();
    if (!icNumber || typeof icNumber !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing icNumber" },
        { status: 400 }
      );
    }

    // Support both keys so it matches your .env.local
    const baseUrl =
      process.env.CUSTOMER_API_BASE_URL ||
      process.env.CUSTOMER_API_BASE ||
      "";

    const username = process.env.CUSTOMER_API_USERNAME || "";
    const password = process.env.CUSTOMER_API_PASSWORD || "";

    // Helpful visibility in the server console
    console.log("[login] ENV CHECK", {
      CUSTOMER_API_BASE_URL: process.env.CUSTOMER_API_BASE_URL ? "set" : "unset",
      CUSTOMER_API_BASE: process.env.CUSTOMER_API_BASE ? "set" : "unset",
      CUSTOMER_API_USERNAME: username ? "set" : "unset",
      CUSTOMER_API_PASSWORD: password ? "set" : "unset",
    });

    if (!baseUrl || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Server is not configured (env missing)" },
        { status: 500 }
      );
    }

    // 1) getCustomerDetails using CertificateNo (IC)
    const trimmedIc = icNumber.trim().toUpperCase();
    const detailsUrl = `${baseUrl.replace(/\/$/, "")}/customer?CertificateNo=${encodeURIComponent(
      trimmedIc
    )}`;

    const authHeader =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

    const res = await fetch(detailsUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.toLowerCase().includes("application/json");
    const rawDetails = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = isJson
        ? rawDetails?.message || JSON.stringify(rawDetails)
        : rawDetails;
      return NextResponse.json(
        { success: false, error: errorMsg || `Upstream error (${res.status})` },
        { status: 502 }
      );
    }

    const verbose =
      (process.env.ALLOW_VERBOSE_LOGIN_LOGS || "").toLowerCase() === "true";
    const toLogDetails = verbose ? rawDetails : buildMasked(rawDetails);
    console.log(
      "[login] getCustomerDetails payload:",
      JSON.stringify(toLogDetails, null, 2)
    );

    const customerId =
      rawDetails?.customer?.customerId ?? rawDetails?.customer?.customerID ?? null;

    console.log("[login] extracted customerId:", customerId);

    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "customerId not found in response",
          raw: verbose ? rawDetails : undefined,
        },
        { status: 502 }
      );
    }

    // 2) getCustomerAccountsDetails using customerId
    let accounts = [];
    let primaryAccountId = null;

    try {
      const accountsUrl = `${baseUrl.replace(
        /\/$/,
        ""
      )}/customer/customer/${encodeURIComponent(customerId)}/accountsdetails`;

      const accRes = await fetch(accountsUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      const accCt = accRes.headers.get("content-type") || "";
      const accIsJson = accCt.toLowerCase().includes("application/json");
      const rawAccounts = accIsJson ? await accRes.json() : await accRes.text();

      if (accRes.ok && Array.isArray(rawAccounts)) {
        accounts = rawAccounts;
        primaryAccountId = rawAccounts[0]?.accountId ?? null;

        const accountsLog = verbose
          ? rawAccounts
          : rawAccounts.map((a) => ({
              accountId: a.accountId,
              productName: a.productName,
              balance: a.balance,
              currency: a.currency,
            }));

        console.log(
          "[login] getCustomerAccountsDetails payload:",
          JSON.stringify(accountsLog, null, 2)
        );
      } else {
        console.warn(
          "[login] getCustomerAccountsDetails failed or non-array response",
          accRes.status
        );
      }
    } catch (accErr) {
      console.error("[login] accountsdetails call error:", accErr);
    }

    // 3) Build normalized user object returned to frontend
    const normalizedUser = {
      customerId,
      icNumber: trimmedIc,
      givenName: rawDetails?.givenName || "",
      familyName: rawDetails?.familyName || "",
      email: rawDetails?.profile?.email || "",
      phone: rawDetails?.cellphone?.phoneNumber || rawDetails?.phone?.localNumber || "",
      // 👇 this will be stored in auth-context + localStorage
      depositAccount: primaryAccountId || "",
      // optional extra accounts array for later use if you want
      accounts: accounts.map((a) => ({
        accountId: a.accountId,
        productName: a.productName,
        balance: a.balance,
        currency: a.currency,
      })),
      raw: verbose
        ? {
            customer: rawDetails,
            accounts,
          }
        : undefined,
    };

    return NextResponse.json({ success: true, user: normalizedUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
