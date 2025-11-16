// lib/impact-api.js
// Helper to fetch carbon impact for a customer from
// CarbonImpactService/GetCarbonImpact/{UserId}.

export async function getCarbonImpact(userId) {
  // Guard: if no user, return safe defaults so the UI still renders
  if (!userId) {
    console.warn("[CarbonImpact] No userId provided, returning defaults.");
    return {
      totalCarbonSaved: 0,
      transactionCount: 0,
      transactions: [],
      raw: null,
    };
  }

  // ❗ Client-side env vars must start with NEXT_PUBLIC_
  const base = process.env.NEXT_PUBLIC_CARBON_IMPACT_BASE_URL || "";
  const apiKey = process.env.NEXT_PUBLIC_CARBON_IMPACT_API_KEY || "";
  const apiKeyHeader =
    process.env.NEXT_PUBLIC_CARBON_IMPACT_API_KEY_HEADER || "X-API-Key";

  if (!base) {
    console.error(
      "[CarbonImpact] NEXT_PUBLIC_CARBON_IMPACT_BASE_URL is not set. Check .env.local."
    );
    return {
      totalCarbonSaved: 0,
      transactionCount: 0,
      transactions: [],
      raw: null,
    };
  }

  const url = `${base.replace(
    /\/$/,
    ""
  )}/GetCarbonImpact/${encodeURIComponent(String(userId))}`;

  const headers = {
    Accept: "application/json",
  };

  if (apiKey) {
    headers[apiKeyHeader] = apiKey;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
    });

    const rawText = await res.text();
    let data = {};

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error("[CarbonImpact] Invalid JSON:", rawText);
        throw new Error(
          `Invalid JSON from CarbonImpact service (status ${res.status})`
        );
      }
    }

    if (!res.ok) {
      const msg =
        data?.error ||
        data?.message ||
        (Array.isArray(data?.Errors) && data.Errors.join(", ")) ||
        `CarbonImpact API failed (${res.status})`;
      throw new Error(msg);
    }

    const allTransactions = Array.isArray(data.Transactions)
      ? data.Transactions
      : [];

    // 🔴 GLOBAL RULE:
    // Donations should NEVER contribute to carbon impact.
    // We detect them by MerchantCategory / Category / category containing "donation".
    const transactions = allTransactions.filter((tx) => {
      const category =
        tx.MerchantCategory ?? tx.Category ?? tx.category ?? "";
      const catStr = String(category).toLowerCase();
      return !catStr.includes("donation");
    });

    return {
      // From your service: TotalCarbonKg + Transactions[]
      totalCarbonSaved: data.TotalCarbonKg ?? 0,
      transactionCount: transactions.length,
      transactions,
      raw: data,
    };
  } catch (err) {
    console.error("[CarbonImpact] Request failed:", err);
    return {
      totalCarbonSaved: 0,
      transactionCount: 0,
      transactions: [],
      raw: null,
    };
  }
}
