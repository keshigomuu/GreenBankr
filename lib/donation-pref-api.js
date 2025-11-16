// lib/donation-pref-api.js

const BASE = process.env.DON_PREF_BASE_URL || "";
const API_KEY = process.env.DON_PREF_API_KEY || "";
const API_HEADER = process.env.DON_PREF_KEY_HEADER || "X-Contacts-Key";

function assertConfigured() {
  if (!BASE) throw new Error("Donation Preference API not configured");
}

function baseUrl() {
  return BASE.replace(/\/$/, "");
}

async function safeJson(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await res.json().catch(() => ({}));
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return {}; }
}

export const DonationPrefAPI = {
  async get(customerId) {
    assertConfigured();

    const url = `${baseUrl()}/GetPreference?CustomerId=${encodeURIComponent(
      customerId
    )}`;

    const headers = {
      Accept: "application/json",
      ...(API_KEY ? { [API_HEADER]: API_KEY } : {}),
    };

    const res = await fetch(url, { headers });
    const data = await safeJson(res);

    if (!res.ok) {
      console.warn("[pref] No preference → treat as none");
      return null;
    }
    return data;
  },

  async add({ customerId, preference, organization }) {
    assertConfigured();

    const url = `${baseUrl()}/AddPreference`;
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(API_KEY ? { [API_HEADER]: API_KEY } : {}),
    };

    const payload = { customerId, preference };
    
    // Only include organization if provided (when preference is "Yes")
    if (organization) {
      payload.organization = organization;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);
    if (!res.ok || data?.Success === false)
      throw new Error(data?.ErrorMessage || "Failed to add preference");

    return data;
  },

  async update({ customerId, preference, organization }) {
    assertConfigured();

    const url = `${baseUrl()}/UpdatePreference`;
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(API_KEY ? { [API_HEADER]: API_KEY } : {}),
    };

    const payload = { customerId, preference };
    
    // Only include organization if provided (when preference is "Yes")
    if (organization) {
      payload.organization = organization;
    }

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);
    if (!res.ok || data?.Success === false)
      throw new Error(data?.ErrorMessage || "Failed to update preference");

    return data;
  },
};
