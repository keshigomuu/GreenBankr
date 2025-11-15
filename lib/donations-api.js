// lib/donations-api.js

const BASE = process.env.DONATIONS_BASE_URL || "";
const API_KEY = process.env.DONATIONS_API_KEY || "";
const API_HEADER = process.env.DONATIONS_API_KEY_HEADER || "X-Contacts-Key";

function assertConfigured() {
  if (!BASE || !API_KEY) throw new Error("Donations API not configured (env missing)");
}

function baseUrl() {
  return BASE.replace(/\/$/, "");
}

function normalizeForDonationsService(customerId) {
  // Service expects an integer CustomerId; strip leading zeros if it's all digits.
  const s = String(customerId ?? "").trim();
  if (/^\d+$/.test(s)) {
    const noZeros = s.replace(/^0+/, "");
    return noZeros.length ? parseInt(noZeros, 10) : 0;
  }
  // If not purely digits, just return as-is; service may reject but we'll log.
  return s;
}

async function safeJson(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt || null; }
}

function looksLikeNoData(status, data) {
  if (status === 404 || status === 204) return true;
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

    const serviceId = normalizeForDonationsService(customerId);
    const payload = {
      // send what the service wants (integer), but keep your global ID unchanged in the app
      customerId: serviceId,
      amount: Number(amount),
      orgId: Number(orgId),
    };

    const url = `${baseUrl()}/AddDonation`;
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      [API_HEADER]: API_KEY,
    };

    console.log("[donations] POST", url, "payload:", payload);

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    const data = await safeJson(res);

    if (!res.ok) {
      console.error("[donations] AddDonation failed:", res.status, data);
      throw new Error(data?.error || data?.message || `AddDonation failed (${res.status})`);
    }

    console.log("[donations] AddDonation OK:", data);
    return data || { donationId: undefined };
  },

  async getByCustomer(customerId) {
    assertConfigured();

    const primaryId = String(customerId);
    const primaryUrl = `${baseUrl()}/GetDonation?CustomerId=${encodeURIComponent(primaryId)}`;
    const headers = { Accept: "application/json", [API_HEADER]: API_KEY };

    // 1) Try with the exact ID first (string)
    console.log("[donations] GET (primary)", primaryUrl);
    let res = await fetch(primaryUrl, { headers });
    let data = await safeJson(res);

    if (!res.ok && !looksLikeNoData(res.status, data)) {
      console.error("[donations] GetDonation primary failed:", res.status, data);
      throw new Error(data?.error || data?.message || `GetDonation failed (${res.status})`);
    }

    // If no data, 2) retry with integer-normalized ID once
    if (!res.ok || looksLikeNoData(res.status, data) || (Array.isArray(data) && data.length === 0)) {
      const intId = normalizeForDonationsService(customerId);
      const needsRetry = intId !== primaryId;
      if (needsRetry) {
        const retryUrl = `${baseUrl()}/GetDonation?CustomerId=${encodeURIComponent(intId)}`;
        console.log("[donations] GET (retry with integer)", retryUrl);
        res = await fetch(retryUrl, { headers });
        data = await safeJson(res);
        if (!res.ok && !looksLikeNoData(res.status, data)) {
          console.error("[donations] GetDonation retry failed:", res.status, data);
          throw new Error(data?.error || data?.message || `GetDonation failed (${res.status})`);
        }
      }
    }

    const list = Array.isArray(data) ? data : [];
    const normalized = list.map((d) => ({
      id: d.Id ?? d.id ?? crypto.randomUUID(),
      customerId: d.Customer_ID ?? d.customerId ?? primaryId,
      amount: d.Amount ?? d.amount ?? 0,
      orgId: d.Org_ID ?? d.orgId ?? 0,
      date: d.DateOfTxn ?? d.date ?? null,
    }));

    console.log("[donations] GetDonation OK: count =", normalized.length);
    return normalized;
  },

  async getAll() {
    assertConfigured();
    const url = `${baseUrl()}/GetAllDonations`;
    const headers = { Accept: "application/json", [API_HEADER]: API_KEY };
    console.log("[donations] GET", url);
    const res = await fetch(url, { headers });
    const data = await safeJson(res);
    if (!res.ok) {
      if (looksLikeNoData(res.status, data)) return [];
      throw new Error(data?.error || data?.message || `GetAllDonations failed (${res.status})`);
    }
    return Array.isArray(data) ? data : [];
  },
};

// GET ALL ORGANISATIONS
async function getAllOrganisations() {
  const url = `${process.env.ORGANISATION_API_BASE_URL}/OrganisationService/GetAllOrganisations`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.ORGANISATION_API_USERNAME}:${process.env.ORGANISATION_API_PASSWORD}`
        ).toString("base64"),
    },
  });

  const raw = await res.text();
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON returned: ${raw}`);
  }

  if (!res.ok) {
    throw new Error(`GetAllOrganisations failed (${res.status})`);
  }

  return data; // array of organisation objects
}


