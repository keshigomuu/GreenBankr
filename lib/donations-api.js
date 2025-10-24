// lib/donations-api.js
const RAW_BASE =
  process.env.DONATIONS_BASE_URL ||
  "https://personal-h83kqaoy.outsystemscloud.com/DonationHistory/rest/DonationHistory";

const API_KEY = (process.env.DONATIONS_API_KEY || "").trim();
const API_KEY_HEADER = (process.env.DONATIONS_API_KEY_HEADER || "X-Api-Key").trim();

function normalizeBaseUrl(url) {
  if (!url) return "";
  const hashIdx = url.indexOf("#");
  const clean = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  return clean.replace(/\/+$/, "");
}
const BASE_URL = normalizeBaseUrl(RAW_BASE);

function makeHeaders(extra = {}) {
  const headers = { ...extra };
  if (API_KEY) headers[API_KEY_HEADER] = API_KEY; // usually X-Contacts-Key
  return headers;
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapDonation(d, i, fallbackCustomerId = null) {
  return {
    id: d.Id ?? d.id ?? String(i + 1),
    customerId: d.Customer_ID ?? d.customerId ?? d.CustomerId ?? fallbackCustomerId,
    amount: toNum(d.Amount ?? d.amount, 0),
    orgId: d.Org_ID ?? d.orgId ?? d.organizationId ?? null,
    date: d.DateOfTxn ?? d.date ?? d.Date ?? null,
  };
}

export class DonationsAPI {
  /** POST /AddDonation  body: { customerId, amount, orgId } -> { donationId } */
  static async addDonation({ customerId, amount, orgId }) {
    const url = `${BASE_URL}/AddDonation`;
    const payload = { customerId, amount: Number(amount), orgId };
    const res = await fetch(url, {
      method: "POST",
      headers: makeHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AddDonation failed: HTTP ${res.status} ${text}`);
    }
    const data = await res.json();
    return { donationId: data?.donationId ?? data?.DonationId ?? null };
  }

  /** GET /GetAllDonations -> array */
  static async getAll() {
    const url = `${BASE_URL}/GetAllDonations`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GetAllDonations failed: HTTP ${res.status} ${text}`);
    }
    const list = await res.json();
    return (Array.isArray(list) ? list : []).map((d, i) => mapDonation(d, i));
  }

  /**
   * GET /GetDonation?CustomerId=... -> array
   * SPECIAL CASE: Some environments return 500 with a body like:
   * {"Errors":["No Donation History found for customer ID: 123"],"StatusCode":500}
   * Treat that as "no donations" instead of an error.
   */
  static async getByCustomer(customerId) {
    const url = `${BASE_URL}/GetDonation?CustomerId=${encodeURIComponent(customerId)}`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Graceful empty state for "no history" responses
      const lower = (text || "").toLowerCase();
      if (
        res.status === 500 &&
        (lower.includes("no donation history") || lower.includes("not found"))
      ) {
        return [];
      }
      throw new Error(`GetDonation failed: HTTP ${res.status} ${text}`);
    }

    const list = await res.json();
    return (Array.isArray(list) ? list : []).map((d, i) => mapDonation(d, i, customerId));
  }
}
