// lib/organisations-api.js
const RAW_BASE =
  process.env.ORGANISATIONS_BASE_URL ||
  "https://kxl.outsystemscloud.com/OrganisationInfo/rest/OrganisationService";

const COMMON_KEY = (process.env.ALL_SERVICES_API_KEY || "").trim();
const COMMON_HDR = (process.env.ALL_SERVICES_API_KEY_HEADER || "").trim();

const SVC_KEY = (process.env.ORGANISATIONS_API_KEY || "").trim();
const SVC_HDR = (process.env.ORGANISATIONS_API_KEY_HEADER || "X-Api-Key").trim();

const API_KEY = (COMMON_KEY || SVC_KEY);
const API_KEY_HEADER = (COMMON_HDR || SVC_HDR || "X-Contacts-Key").trim();

function normalizeBaseUrl(url) {
  if (!url) return "";
  const hashIdx = url.indexOf("#");
  const clean = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
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
      `OrganisationService returned non-JSON (status ${res.status}). ` +
      `Content-Type='${ct}'. Body: ${snippet}`
    );
  }
}

function mapOrg(o, i) {
  return {
    id: Number(o.OrganisationId ?? o.id ?? i + 1),
    name: o.Name ?? o.name ?? "Organisation",
    description: o.Description ?? o.description ?? "",
    country: o.Country ?? o.country ?? "",
    websiteUrl: o.WebsiteUrl ?? o.websiteUrl ?? "",
  };
}

export class OrganisationsAPI {
  /** GET /GetAllOrganisations -> array */
  static async getAll() {
    const url = `${BASE_URL}/GetAllOrganisations`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`GetAllOrganisations failed: HTTP ${res.status} ${text}`);
    }
    ensureJsonOrThrow(res, text);

    const list = JSON.parse(text);
    return (Array.isArray(list) ? list : []).map((o, i) => mapOrg(o, i));
  }

  /** GET /GetOrganisationById?OrganisationId=... -> object */
  static async getById(id) {
    const orgId = parseInt(String(id), 10);
    const url = `${BASE_URL}/GetOrganisationById?OrganisationId=${encodeURIComponent(orgId)}`;
    const res = await fetch(url, { cache: "no-store", headers: makeHeaders() });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`GetOrganisationById failed: HTTP ${res.status} ${text}`);
    }
    ensureJsonOrThrow(res, text);

    const obj = JSON.parse(text);
    return mapOrg(obj, 0);
  }
}
