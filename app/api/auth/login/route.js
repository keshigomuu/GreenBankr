// app/api/auth/login/route.js
export const runtime = "nodejs"; // Changed from "node" to "nodejs"
import { NextResponse } from "next/server";

/* --- helpers --- */
function basicAuthHeader() {
  const u = (process.env.CUSTOMER_API_USERNAME || "").trim();
  const p = (process.env.CUSTOMER_API_PASSWORD || "").trim();
  const token = Buffer.from(`${u}:${p}`).toString("base64");
  return `Basic ${token}`;
}

function urlForIC(ic) {
  const base = (process.env.CUSTOMER_API_BASE || "https://smuedu-dev.outsystemsenterprise.com")
    .replace(/\/+$/, "");
  const endpoint = "/gateway/rest/customer";
  return `${base}${endpoint}?CertificateNo=${encodeURIComponent(ic)}`;
}

async function readSafe(resp) {
  const ct = resp.headers.get("content-type") || "";
  if (ct.toLowerCase().includes("application/json")) {
    try {
      return { kind: "json", body: await resp.json() };
    } catch {
      // fall-through to text below
    }
  }
  return { kind: "text", body: await resp.text() };
}

/* --- handler --- */
export async function POST(req) {
  try {
    const { icNumber } = await req.json();
    const ic = (icNumber || "").trim().toUpperCase();
    
    if (!ic) {
      return NextResponse.json({ success: false, error: "Missing icNumber" }, { status: 400 });
    }

    console.log('🔍 Looking up customer with IC:', ic);
    console.log('🌐 API URL:', urlForIC(ic));

    const resp = await fetch(urlForIC(ic), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: basicAuthHeader(),
      },
      cache: "no-store",
      redirect: "manual",
    });

    console.log('📊 Response status:', resp.status);

    const { kind, body } = await readSafe(resp);
    console.log('📄 Response body:', body);

    if (!resp.ok) {
      return NextResponse.json(
        {
          success: false,
          error: kind === "json" ? JSON.stringify(body) : (body || `Upstream error ${resp.status}`),
        },
        { status: resp.status }
      );
    }

    // OK → user exists
    const data = kind === "json" ? body : {};
    const firstName = data?.givenName ?? data?.profile?.firstName ?? "";
    const lastName = data?.familyName ?? data?.profile?.lastName ?? "";
    const email = data?.email ?? data?.emailAddress ?? "";
    const customerName = (data?.customerName ?? `${firstName} ${lastName}`.trim()) || "Customer";
    const customerID = data?.profile?.BankId ?? data?.BankId ?? null;

    const customer = {
      icNumber: ic,
      emailAddress: email,
      firstName,
      lastName,
      customerName,
      customerID,
      raw: data,
    };

    console.log('✅ Customer found:', customer);

    return NextResponse.json({ success: true, customer }, { status: 200 });
    
  } catch (err) {
    console.error('💥 API Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
