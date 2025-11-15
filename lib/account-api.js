// lib/account-api.js
// Client-side helper: calls our own Next.js API route (no secrets here)

export async function getDepositBalance(customerId, accountId) {
  if (!customerId || !accountId) {
    throw new Error("Missing customerId or accountId");
  }

  const params = new URLSearchParams({ customerId, accountId });

  const res = await fetch(`/api/accounts/balance?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Balance API failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data?.balance ?? 0;
}

// lib/account-api.js

// ...keep your existing imports & getDepositBalance...


export async function getTransactionHistory(accountId, startDate, endDate) {
  if (!accountId) {
    throw new Error("Missing accountId");
  }
  if (!startDate || !endDate) {
    throw new Error("Missing start/end date");
  }

  const params = new URLSearchParams({
    accountId,
    startDate,
    endDate,
  });

  const res = await fetch(`/api/accounts/transactions?${params.toString()}`, {
    method: "GET",
  });

  const raw = await res.text();  // read as text first

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    // This is where your "<!DOCTYPE..." error came from
    const snippet = raw.slice(0, 200);
    throw new Error(
      `Server returned non-JSON response (status ${res.status}): ${snippet}`
    );
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to load transactions (status ${res.status})`);
  }

  return data.transactions || [];
}
