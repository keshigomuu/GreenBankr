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

export async function processTransaction({
  customerId,
  custAcctId,
  receivingAcctId,
  amount,
  category,
  makeDonation = false,
}) {
  const res = await fetch("/api/accounts/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId,
      custAcctId,
      receivingAcctId,
      amount,
      category,
      makeDonation,
    }),
  });

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `ProcessTxn returned non-JSON response (status ${res.status})`
    );
  }

  if (!res.ok || !data.success) {
    // If backend forwarded the JSON string from SMUtBank,
    // try to parse {"Errors":["Invalid API Key"],"StatusCode":500}
    let msg = data.error || "";
    try {
      const inner = JSON.parse(msg);
      if (inner?.Errors?.length) msg = inner.Errors[0];
    } catch {
      // ignore parse error
    }
    throw new Error(msg || `Failed to process transaction (status ${res.status})`);
  }

  return data.transaction;
}

export async function getTransactionCategories(transactionIds) {
  if (!transactionIds || transactionIds.length === 0) {
    return {};
  }

  const params = new URLSearchParams({
    ids: transactionIds.join(","),
  });

  const res = await fetch(`/api/transactions/categories?${params.toString()}`, {
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(
      data.error || `Failed to load categories (status ${res.status})`
    );
  }

  // { [transactionId]: "Shopping", ... }
  return data.categories || {};
}


export async function depositCash({ customerId, accountId, amount, narrative }) {
  const res = await fetch("/api/accounts/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, accountId, amount, narrative }),
  });

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Deposit API returned non-JSON (status ${res.status})`);
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Deposit failed (status ${res.status})`);
  }

  // { balanceAfter, balanceBefore, transactionId, category, paymentMode }
  return data.result;
}

export async function withdrawCash({ customerId, accountId, amount, narrative }) {
  const res = await fetch("/api/accounts/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, accountId, amount, narrative }),
  });

  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Withdraw API returned non-JSON (status ${res.status})`);
  }

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Withdrawal failed (status ${res.status})`);
  }

  // { balanceAfter, balanceBefore, transactionId, category, paymentMode }
  return data.result;
}
