// lib/orchestration-api.js

export async function runOrchestration(payload) {
  const base = process.env.ORCHESTRATION_SERVICE_BASE_URL;
  const apiKey = process.env.ORCHESTRATION_SERVICE_API_KEY;
  const apiKeyHeader = process.env.ORCHESTRATION_SERVICE_API_KEY_HEADER;

  const url = base.endsWith("/")
    ? base + "OrchestrationService"
    : base + "/OrchestrationService";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      [apiKeyHeader]: apiKey,
    },
    body: JSON.stringify({
      CustomerId: payload.customerId,
      Cust_Acct_Id: payload.custAcctId,
      Recieving_Acct_Id: payload.receivingAcctId,
      txnAmt: payload.amount,
      MerchantCategory: payload.category,
    }),
  });

  const data = await res.json();

  // ⭐ FIX: Map OutSystems PascalCase → JS camelCase
  return {
    transactionId: data.TransactionId,
    transactionAmount: data.TransactionAmount,       // FIXED
    totalPointsEarned: data.TotalPointsEarned,       // FIXED
    carbonIntensity: data.CarbonIntensity,
    notificationStatus: data.NotificationStatus,
  };
}
