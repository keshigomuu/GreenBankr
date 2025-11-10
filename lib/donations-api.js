// lib/donations-api.js

const BASE = process.env.DONATIONS_BASE_URL || ""; // e.g. https://.../DonationHistory/rest/DonationHistory
const API_KEY = process.env.DONATIONS_API_KEY || "";
const API_HEADER = process.env.DONATIONS_API_KEY_HEADER || "X-Contacts-Key";

function assertConfigured() {
  if (!BASE || !API_KEY) throw new Error("Donations API not configured (env missing)");
}

function baseUrl() {
  return BASE.replace(/\/$/, "");
}

async function safeJson(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt || null; }
}

// Heuristic: some dev services return 404/500 when no rows exist.
// Treat these as "no data" rather than hard errors when the payload is empty-ish.
function looksLikeNoData(status, data) {
  if (status === 404) return true;
  if (status === 204) return true;
  if (status === 500) {
    if (data == null) return true;
    if (Array.isArray(data) && data.length === 0) return true;
    const msg = typeof data === "string" ? data : (data?.message || data?.error || "");
    if (typeof msg === "string" && /no (donation|record)|not found|empty/i.test(msg)) return true;
  }
  return false;
}

export const DonationsAPI = {
  async addDonation({ customerId, amount, orgId }) {
    assertConfigured();
    const url = `${baseUrl()}/AddDonation`;

    const payload = {
      customerId: String(customerId),
      amount: Number(amount),
      orgId: Number(orgId),
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        [API_HEADER]: API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data?.error || data?.message || `AddDonation failed (${res.status})`);
    }
    // Expected: { donationId: "..." }
    return data || { donationId: undefined };
  },

  async getByCustomer(customerId) {
    assertConfigured();
    const id = String(customerId);
    const url = `${baseUrl()}/GetDonation?CustomerId=${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        [API_HEADER]: API_KEY,
      },
    });

    const data = await safeJson(res);

    if (!res.ok) {
      // Gracefully handle the "no data" cases as empty list
      if (looksLikeNoData(res.status, data)) return [];
      throw new Error(data?.error || data?.message || `GetDonation failed (${res.status})`);
    }

    const list = Array.isArray(data) ? data : [];
    // Normalize fields for the UI
    return list.map((d) => ({
      id: d.Id ?? d.id ?? crypto.randomUUID(),
      customerId: d.Customer_ID ?? d.customerId ?? id,
      amount: d.Amount ?? d.amount ?? 0,
      orgId: d.Org_ID ?? d.orgId ?? 0,
      date: d.DateOfTxn ?? d.date ?? null,
    }));
  },

  async getAll() {
    assertConfigured();
    const url = `${baseUrl()}/GetAllDonations`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", [API_HEADER]: API_KEY },
    });
    const data = await safeJson(res);
    if (!res.ok) {
      if (looksLikeNoData(res.status, data)) return [];
      throw new Error(data?.error || data?.message || `GetAllDonations failed (${res.status})`);
    }
    return Array.isArray(data) ? data : [];
  },
};
