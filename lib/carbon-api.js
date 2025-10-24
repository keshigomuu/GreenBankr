// lib/carbon-api.js
// Endpoints:
//  POST /CreateCarbonImpact             body: { UserId, MerchantCategory, Amount }
//  GET  /GetCarbonImpact/{UserId}       -> { UserId, TotalCarbonKg, Transactions: [...] }

const RAW_BASE =
  process.env.CARBON_BASE_URL ||
  "https://personal-ssh2l02j.outsystemscloud.com/CarbonImpact/rest/CarbonImpactService";

const COMMON_KEY = (process.env.ALL_SERVICES_API_KEY || "").trim();
const COMMON_HDR = (process.env.ALL_SERVICES_API_KEY_HEADER || "").trim();

const SVC_KEY = (process.env.CARBON_API_KEY || "").trim();
const SVC_HDR = (process.env.CARBON_API_KEY_HEADER || "X-Api-Key").trim();

const API_KEY = (COMMON_KEY || SVC_KEY);
const API_KEY_HEADER = (COMMON_HDR || SVC_HDR || "X-Contacts-Key").trim();

function normalizeBaseUrl(url) {
  if (!url) return "";
  const i = url.indexOf("#");
  const clean = i >= 0 ? url.slice(0, i) : url;
  return clean.replace(/\/+$/, "");
}
const BASE_URL = normalizeBaseUrl(RAW_BASE);

function makeHeaders(extra = {}) {
  const headers = { Accept: "application/json", ...extra };
  if (API_KEY) headers[API_KEY_HEADER] = API_KEY;
  return headers;
}

function ensureJsonOrThrow(res, bodyText) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) {
    const snippet = (bodyText || "").slice(0, 180).replace(/\s+/g, " ");
    throw new Error(
      `CarbonImpactService returned non-JSON (status ${res.status}). ` +
        `Content-Type='${ct}'. Body: ${snippet}`
    );
  }
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapTxn(t, i) {
  return {
    id: t.Id ?? t.id ?? String(i + 1),
    userId: t.UserId ?? t.userId ?? "",
    transactionId: t.TransactionId ?? t.transactionId ?? "",
    transactionDate: t.TransactionDate ?? t.transactionDate ?? t.Date ?? null,
    merchantCategory: t.MerchantCategory ?? t.merchantCategory ?? "",
    amount: toNum(t.Amount ?? t.amount, 0),
    carbonKg: toNum(t.CarbonKg ?? t.carbonKg, 0),
    carbonIntensity: toNum(t.CarbonIntensity ?? t.carbonIntensity, 0),
  };
}

export class CarbonAPI {
  /** GET /GetCarbonImpact/{UserId} */
  static async getImpactByUser(userId) {
    const url = `${BASE_URL}/GetCarbonImpact/${encodeURIComponent(userId)}`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`GetCarbonImpact failed: HTTP ${res.status} ${text}`);
    }
    ensureJsonOrThrow(res, text);

    const obj = JSON.parse(text) || {};
    return {
      userId: obj.UserId ?? userId,
      totalCarbonKg: toNum(obj.TotalCarbonKg ?? obj.totalCarbonKg, 0),
      transactions: Array.isArray(obj.Transactions ?? obj.transactions)
        ? (obj.Transactions ?? obj.transactions).map(mapTxn)
        : [],
    };
  }

  /** POST /CreateCarbonImpact  body: { UserId, MerchantCategory, Amount } */
  static async createImpact({ userId, merchantCategory, amount }) {
    const url = `${BASE_URL}/CreateCarbonImpact`;
    const payload = {
      UserId: userId,
      MerchantCategory: merchantCategory,
      Amount: Number(amount),
    };
    const res = await fetch(url, {
      method: "POST",
      headers: makeHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`CreateCarbonImpact failed: HTTP ${res.status} ${text}`);
    }
    ensureJsonOrThrow(res, text);
    const obj = JSON.parse(text) || {};
    // Service returns fields incl. CarbonKg, CarbonIntensity, etc.
    return {
      userId: obj.UserId ?? userId,
      transactionId: obj.TransactionId ?? "",
      activityId: obj.ActivityId ?? "",
      carbonKg: toNum(obj.CarbonKg, 0),
      carbonIntensity: toNum(obj.CarbonIntensity, 0),
    };
  }
}
