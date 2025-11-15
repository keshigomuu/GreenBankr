// lib/impact-api.js
// Helper to fetch carbon impact for a customer.
// Soft-fails (returns zeros) if the service/env is not configured.

export async function getCarbonImpact(customerId) {
  if (!customerId) {
    return { totalCarbonSaved: 0, transactionCount: 0 };
  }

  const base =
    process.env.CARBON_IMPACT_BASE_URL ||
    process.env.NEXT_PUBLIC_CARBON_IMPACT_BASE_URL ||
    "";

  const apiKey =
    process.env.CARBON_IMPACT_API_KEY ||
    process.env.NEXT_PUBLIC_CARBON_IMPACT_API_KEY ||
    "";

  const apiKeyHeader =
    process.env.CARBON_IMPACT_API_KEY_HEADER || "X-API-Key";

  // If not configured, just return default impact so UI still works
  if (!base || !apiKey) {
    console.warn("[CarbonImpact] Not configured — returning defaults.");
    return {
      totalCarbonSaved: 0,
      transactionCount: 0,
    };
  }

  const url = `${base.replace(/\/$/, "")}/CarbonImpactByCustomer?customerId=${encodeURIComponent(
    String(customerId)
  )}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      [apiKeyHeader]: apiKey,
    },
  });

  const raw = await res.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    throw new Error(
      `Invalid JSON from CarbonImpact service (status ${res.status})`
    );
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      (Array.isArray(data?.Errors) && data.Errors.join(", ")) ||
      `CarbonImpact API failed (${res.status})`;
    throw new Error(msg);
  }

  return {
    totalCarbonSaved: data.TotalCarbonSaved ?? 0,
    transactionCount: data.TransactionCount ?? 0,
    raw: data,
  };
}
