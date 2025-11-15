"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getDepositBalance, getTransactionHistory } from "@/lib/account-api";

export default function AccountsPage() {
  const { user, getCustomerId, getDepositAccount } = useAuth();

  const [customerId, setCustomerId] = useState(null);
  const [accountId, setAccountId] = useState("");

  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState("");

  // Transactions state
  const [startDate, setStartDate] = useState("2020-12-31");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txError, setTxError] = useState("");

  // Resolve IDs from context once user is available
  useEffect(() => {
    const cid = getCustomerId?.() ?? user?.customerId ?? null;
    const acc =
      getDepositAccount?.() ??
      user?.depositAccount ??
      user?.raw?.DepositeAcct ??
      "";

    console.log("AccountsPage IDs:", { cid, acc, user });

    setCustomerId(cid);
    setAccountId(acc);
  }, [user, getCustomerId, getDepositAccount]);

  // Fetch balance when IDs are ready
  useEffect(() => {
    if (!customerId || !accountId) {
      setLoadingBalance(false);
      return;
    }

    async function loadBalance() {
      try {
        setLoadingBalance(true);
        setBalanceError("");
        const b = await getDepositBalance(customerId, accountId);
        setBalance(b);
      } catch (err) {
        console.error("Balance fetch error:", err);
        setBalanceError(err.message || "Failed to load balance");
      } finally {
        setLoadingBalance(false);
      }
    }

    loadBalance();
  }, [customerId, accountId]);

  // Fetch transactions when IDs or date range change
  useEffect(() => {
    if (!customerId || !accountId) {
      setLoadingTx(false);
      setTransactions([]);
      return;
    }

    // simple validation: don't call API if dates invalid
    if (!startDate || !endDate || startDate > endDate) {
      setTxError("Please choose a valid start/end date range.");
      setTransactions([]);
      setLoadingTx(false);
      return;
    }

    async function loadTransactions() {
      try {
        setLoadingTx(true);
        setTxError("");
        const txs = await getTransactionHistory(accountId, startDate, endDate);

        // sort newest → oldest by transactionDate
        const sorted = [...txs].sort((a, b) => {
          const da = new Date(a.transactionDate || 0).getTime();
          const db = new Date(b.transactionDate || 0).getTime();
          return db - da;
        });

        setTransactions(sorted);
      } catch (err) {
        console.error("Transactions fetch error:", err);
        setTxError(err.message || "Failed to load transactions");
        setTransactions([]);
      } finally {
        setLoadingTx(false);
      }
    }

    loadTransactions();
  }, [customerId, accountId, startDate, endDate]);

  // Helper: format transaction amount with + / − and colour
  const renderAmount = (tx) => {
    const amt = Number(tx.transactionAmount || 0);

    // Treat as credit if this account is the destination OR type 200 (deposit)
    const isCredit =
      tx.accountTo === accountId || String(tx.transactionType) === "200";

    const sign = isCredit ? "+" : "-";
    const display = `${sign}$${Math.abs(amt).toFixed(2)}`;

    const colourClass = isCredit ? "text-green-600" : "text-red-600";

    return <span className={`text-right font-semibold ${colourClass}`}>{display}</span>;
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-SG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const hasAccount = !!customerId && !!accountId;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="text-muted-foreground">
            Overview of your GreenBankr deposit account
          </p>

          {/* Balance card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {balanceError && (
                <p className="text-sm text-red-500 mb-2">{balanceError}</p>
              )}

              {!hasAccount ? (
                <p className="text-muted-foreground">
                  No deposit account found for this user. Try signing up again
                  or check that signup is returning <code>DepositeAcct</code>.
                </p>
              ) : loadingBalance ? (
                <p className="text-muted-foreground">Loading balance...</p>
              ) : (
                <p className="text-4xl font-bold text-foreground">
                  ${Number(balance ?? 0).toFixed(2)}
                </p>
              )}

              <p className="mt-2 text-sm text-muted-foreground">
                Account ID: {accountId || "—"}
              </p>
            </CardContent>
          </Card>

          {/* Transaction history card */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAccount ? (
                <p className="text-muted-foreground">
                  No account available to load transactions.
                </p>
              ) : (
                <>
                  {/* Date filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-muted-foreground mb-1">
                        Start date
                      </label>
                      <input
                        type="date"
                        className="border rounded px-2 py-1 bg-background text-sm"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm text-muted-foreground mb-1">
                        End date
                      </label>
                      <input
                        type="date"
                        className="border rounded px-2 py-1 bg-background text-sm"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 flex items-end text-sm text-muted-foreground">
                      <span>
                        Transactions auto-refresh when you change the date
                        range.
                      </span>
                    </div>
                  </div>

                  {txError && (
                    <p className="text-sm text-red-500 mb-2">{txError}</p>
                  )}

                  {loadingTx ? (
                    <p className="text-muted-foreground">
                      Loading transactions...
                    </p>
                  ) : transactions.length === 0 ? (
                    <p className="text-muted-foreground">
                      No transactions found for this period.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {/* header row */}
                      <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                        <span>Date / Time</span>
                        <span>From</span>
                        <span>To</span>
                        <span className="text-right">Amount</span>
                        <span>Currency</span>
                        <span>Payment Mode</span>
                      </div>

                      {transactions.map((tx) => (
                        <div
                          key={tx.transactionId}
                          className="grid grid-cols-6 gap-2 text-sm py-2 border-b last:border-b-0"
                        >
                          <span>{formatDateTime(tx.transactionDate)}</span>
                          <span className="truncate">
                            {tx.accountFrom || "—"}
                          </span>
                          <span className="truncate">
                            {tx.accountTo || "—"}
                          </span>
                          {renderAmount(tx)}
                          <span>{tx.currency || "—"}</span>
                          <span>{tx.paymentMode || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
