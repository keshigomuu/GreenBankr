// lib/organisations-api.js

const RAW_BASE =
  process.env.ORGANISATIONS_BASE_URL ||
  "https://kxl.outsystemscloud.com/OrganisationInfo/rest/OrganisationService";

const API_KEY = (process.env.ORGANISATIONS_API_KEY || "").trim();
const API_KEY_HEADER = (process.env.ORGANISATIONS_API_KEY_HEADER || "X-Contacts-Key").trim();

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

async function safeJson(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) { try { return await res.json(); } catch { return null; } }
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt || null; }
}

export class OrganisationsAPI {
  /** GET /GetAllOrganisations */
  static async getAll() {
    const url = `${BASE_URL}/GetAllOrganisations`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });
    const data = await safeJson(res);

    if (!res.ok) {
      throw new Error(`GetAllOrganisations failed: HTTP ${res.status} ${typeof data === "string" ? data : ""}`);
    }

    // The API returns an array of organisations
    const list = Array.isArray(data) ? data : Array.isArray(data?.organisations) ? data.organisations : [];
    const organisations = list.map((o, i) => ({
      id: o.organisationId ?? o.id ?? o.OrganisationId ?? String(i + 1),
      name: o.name ?? o.organisationName ?? o.Name ?? "Organisation",
      description: o.description ?? o.Description ?? "",
      category: o.category ?? o.Category ?? "Other",
      logo: o.logo ?? o.Logo ?? null,
      active: o.active ?? o.Active ?? true,
    }));

    return { organisations };
  }
}
