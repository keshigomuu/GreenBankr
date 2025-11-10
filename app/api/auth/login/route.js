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

    const url = `${baseUrl.replace(/\/$/, "")}/customer?CertificateNo=${encodeURIComponent(
      icNumber.trim().toUpperCase()
    )}`;

    const authHeader =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.toLowerCase().includes("application/json");
    const raw = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = isJson ? raw?.message || JSON.stringify(raw) : raw;
      return NextResponse.json(
        { success: false, error: errorMsg || `Upstream error (${res.status})` },
        { status: 502 }
      );
    }

    // ---- LOG THE PAYLOAD HERE ----
    const verbose = (process.env.ALLOW_VERBOSE_LOGIN_LOGS || "").toLowerCase() === "true";
    const toLog = verbose ? raw : buildMasked(raw);
    console.log("[login] getCustomerDetails payload:", JSON.stringify(toLog, null, 2));
    // --------------------------------

    const customerId =
      raw?.customer?.customerId ?? raw?.customer?.customerID ?? null;

    // Also log the extracted id for sanity
    console.log("[login] extracted customerId:", customerId);

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "customerId not found in response", raw: verbose ? raw : undefined },
        { status: 502 }
      );
    }

    const normalizedUser = {
      customerId,
      icNumber: icNumber.trim().toUpperCase(),
      givenName: raw?.givenName || "",
      familyName: raw?.familyName || "",
      email: raw?.profile?.email || "",
      phone: raw?.cellphone?.phoneNumber || raw?.phone?.localNumber || "",
      raw: verbose ? raw : undefined, // keep raw only when verbose logging is allowed
    };

    return NextResponse.json({ success: true, user: normalizedUser }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown server error" },
      { status: 500 }
    );
  }
}
