// lib/loyalty-api.js
const RAW_BASE =
  process.env.LOYALTY_BASE_URL ||
  "https://smuedu-dev.outsystemsenterprise.com/LGB_LoyaltyPoints/rest/LoyaltyPoints";

const API_KEY = (process.env.LOYALTY_API_KEY || "").trim();
const API_KEY_HEADER = (process.env.LOYALTY_API_KEY_HEADER || "X-Api-Key").trim();

function normalizeBaseUrl(url) {
  if (!url) return "";
  const hashIdx = url.indexOf("#");
  const clean = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  return clean.replace(/\/+$/, "");
}
const BASE_URL = normalizeBaseUrl(RAW_BASE);

function makeHeaders(extra = {}) {
  const headers = { ...extra };
  if (API_KEY) headers[API_KEY_HEADER] = API_KEY; // e.g., X-Contacts-Key
  return headers;
}

// Loyalty API wants: "REDUCE" | "INCREASE"
function normalizeOperation(op) {
  const s = String(op || "").trim().toUpperCase();
  if (s === "INCREASE" || s === "ADD" || s === "CREDIT" || s === "PLUS") return "INCREASE";
  if (s === "REDUCE" || s === "DEDUCT" || s === "SUBTRACT" || s === "MINUS") return "REDUCE";
  return s; // pass through (will 400 if invalid)
}

export class LoyaltyAPI {
  /** GET /GetLoyaltyPoints?customerId=... -> { customerId, points } */
  static async getPoints(customerId) {
    const url = `${BASE_URL}/GetLoyaltyPoints?customerId=${encodeURIComponent(customerId)}`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GetLoyaltyPoints failed: HTTP ${res.status} ${text}`);
    }
    const data = await res.json();
    return {
      customerId: data?.customerId ?? customerId,
      points: Number(data?.points ?? 0),
    };
  }

  /**
   * PUT /UpdateLoyaltyPoints
   * body: { customerId, amount, operation }  // operation: "REDUCE" | "INCREASE"
   * -> { customerId, amount, pointsBefore, pointsAfter }
   */
  static async updatePoints({ customerId, amount, operation }) {
    const url = `${BASE_URL}/UpdateLoyaltyPoints`;
    const payload = {
      customerId,
      amount: Number(amount ?? 0),
      operation: normalizeOperation(operation),
    };

    const res = await fetch(url, {
      method: "PUT",
      headers: makeHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`UpdateLoyaltyPoints failed: HTTP ${res.status} ${text}`);
    }

    const data = await res.json();
    return {
      customerId: data?.customerId ?? customerId,
      amount: Number(data?.amount ?? payload.amount),
      pointsBefore: Number(data?.pointsBefore ?? 0),
      pointsAfter: Number(data?.pointsAfter ?? 0),
    };
  }
}
