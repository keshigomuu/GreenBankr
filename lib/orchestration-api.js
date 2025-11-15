// lib/orchestration-api.js
// Calls OutSystems OrchestrationService (composite logic)

export async function runOrchestration({
  customerId,
  custAcctId,
  receivingAcctId,
  amount,
  category,
}) {
  const base =
    process.env.ORCHESTRATION_BASE_URL ||
    process.env.NEXT_PUBLIC_ORCHESTRATION_BASE_URL ||
    "";
  const apiKey =
    process.env.ORCHESTRATION_API_KEY ||
    process.env.NEXT_PUBLIC_ORCHESTRATION_API_KEY ||
    "";
  const apiKeyHeader =
    process.env.ORCHESTRATION_API_KEY_HEADER || "X-API-Key";

  // If not configured → skip silently (used during local dev)
  if (!base || !apiKey) {
    console.warn("[Orchestration] Not configured — skipping.");
    return {
      transactionId: null,
      donationAmount: 0,
      carbonImpact: 0,
      loyaltyPoints: 0,
      notificationStatus: "SKIPPED_NOT_CONFIGURED",
      raw: null,
    };
  }

  const endpoint = `${base.replace(/\/$/, "")}/OrchestrationService`;

  const payload = {
    CustomerId: String(customerId),
    Cust_Acct_Id: String(custAcctId),
    Recieving_Acct_Id: String(receivingAcctId),
    txnAmt: Number(amount),
    MerchantCategory: String(category),
  };

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    [apiKeyHeader]: apiKey,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();
  let data;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (e) {
    throw new Error(
      `Invalid JSON from OrchestrationService (status ${res.status})`
    );
  }

  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      (Array.isArray(data?.Errors) && data.Errors.join(", ")) ||
      `Orchestration failed (${res.status})`;

    throw new Error(msg);
  }

  return {
    transactionId: data.TransactionId ?? null,
    donationAmount: data.DonationAmount ?? 0,
    carbonImpact: data.CarbonImpact ?? 0,
    loyaltyPoints: data.LoyaltyPoints ?? 0,
    notificationStatus: data.NotificationStatus ?? "",
    raw: data,
  };
}
