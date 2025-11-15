export async function getDepositBalance(customerId, accountId) {
  const base = process.env.ACCOUNT_BASE_URL;
  const user = process.env.ACCOUNT_API_USERNAME;
  const pass = process.env.ACCOUNT_API_PASSWORD;

  if (!base) throw new Error("Missing ACCOUNT_BASE_URL");

  const url = `${base}/account/${customerId}/${accountId}/balance`;

  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Balance fetch failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data?.balance ?? 0;
}
