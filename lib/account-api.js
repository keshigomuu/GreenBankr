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
