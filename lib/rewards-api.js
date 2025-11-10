// lib/rewards-api.js

const RAW_BASE =
  process.env.REWARDS_BASE_URL ||
  "https://personal-5duzlnvb.outsystemscloud.com/RewardsMicroservice/rest/Rewards";

const API_KEY = (process.env.REWARDS_API_KEY || "").trim();
const API_KEY_HEADER = (process.env.REWARDS_API_KEY_HEADER || "X-Api-Key").trim();

function normalizeBaseUrl(url) {
  if (!url) return "";
  const hashIdx = url.indexOf("#");
  const clean = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  return clean.replace(/\/+$/, "");
}
const BASE_URL = normalizeBaseUrl(RAW_BASE);

function makeHeaders(extra = {}) {
  const headers = { ...extra };
  if (API_KEY) headers[API_KEY_HEADER] = API_KEY;
  return headers;
}

function toBool(v, fallback = true) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const x = v.trim().toLowerCase();
    if (x === "true") return true;
    if (x === "false") return false;
  }
  if (typeof v === "number") return v !== 0;
  return fallback;
}
function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
async function safeJson(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) { try { return await res.json(); } catch { return null; } }
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt || null; }
}
function looksLikeNoData(status, data) {
  if (status === 404 || status === 204) return true;
  if (status === 500) {
    if (data == null) return true;
    if (Array.isArray(data) && data.length === 0) return true;
    const msg = typeof data === "string" ? data : (data?.message || data?.error || "");
    if (typeof msg === "string" && /no (claim|record)|not found|empty/i.test(msg)) return true;
  }
  return false;
}

export class RewardsAPI {
  /** GET /Rewards/GetCatalog?active=... */
  static async getCatalog(active = true) {
    const url = `${BASE_URL}/GetCatalog?active=${encodeURIComponent(active)}`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });
    const data = await safeJson(res);

    if (!res.ok) {
      if (looksLikeNoData(res.status, data)) return { rewards: [] };
      throw new Error(`GetCatalog failed: HTTP ${res.status} ${typeof data === "string" ? data : ""}`);
    }

    const list = Array.isArray(data) ? data : Array.isArray(data?.rewards) ? data.rewards : [];
    const rewards = list.map((r, i) => ({
      id: r.rewardId ?? r.id ?? r.RewardId ?? String(i + 1),
      name: r.item ?? r.name ?? r.Item ?? "Reward",
      description: r.description ?? r.Description ?? "",
      points: toNum(r.pointsCost ?? r.points ?? r.PointsCost, 0),
      stockAvailable: toNum(r.stockAvailable ?? r.StockAvailable ?? r.stock, null),
      active: toBool(r.active ?? r.Active, true),
      category: r.category ?? "Other",
      icon: r.icon ?? "Gift",
    }));

    return { rewards: active ? rewards.filter((x) => x.active) : rewards };
  }

  /** GET /Rewards/ListClaims?customerId=... */
  static async listClaims(customerId) {
    const url = `${BASE_URL}/ListClaims?customerId=${encodeURIComponent(customerId)}`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });
    const data = await safeJson(res);

    if (!res.ok) {
      if (looksLikeNoData(res.status, data)) return { claims: [] };
      throw new Error(`ListClaims failed: HTTP ${res.status} ${typeof data === "string" ? data : ""}`);
    }

    const list = Array.isArray(data) ? data : [];
    const claims = list.map((c, i) => ({
      claimId: c.claimId ?? c.ClaimId ?? String(i + 1),
      rewardId: c.rewardId ?? c.RewardId ?? c.id ?? null,
      item: c.item ?? c.Item ?? c.name ?? "Reward",
      description: c.description ?? c.Description ?? "",
      pointsCost: toNum(c.pointsCost ?? c.PointsCost ?? c.points, 0),
      claimDate: c.claimDate ?? c.ClaimDate ?? null,
      status: c.status ?? c.Status ?? "claimed",
    }));

    return { claims };
  }

  /** POST /Rewards/ClaimRewards  body: { customerId, rewardId } */
  static async claimReward(customerId, rewardId) {
    const url = `${BASE_URL}/ClaimRewards`;
    const res = await fetch(url, {
      method: "POST",
      headers: makeHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ customerId, rewardId }),
    });
    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(`ClaimRewards failed: HTTP ${res.status} ${typeof data === "string" ? data : ""}`);
    }
    return { claimId: data?.claimId ?? data?.ClaimId ?? data?.id ?? null };
  }
}
