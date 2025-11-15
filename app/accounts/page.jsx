"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import {
  getDepositBalance,
  getTransactionHistory,
  processTransaction,
  getTransactionCategories, 
} from "@/lib/account-api";

export default function AccountsPage() {
  const { user, getCustomerId, getDepositAccount } = useAuth();

  const [customerId, setCustomerId] = useState(null);
  const [accountId, setAccountId] = useState("");

  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [balanceError, setBalanceError] = useState("");

  // Transaction history state
  const [startDate, setStartDate] = useState("2020-12-31");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txError, setTxError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  // Local map: transactionId -> MerchantCategory (for UI-created txns)
  const [categoryMap, setCategoryMap] = useState({});

  // Form state for ProcessTxn
  const [receivingAcctId, setReceivingAcctId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transport");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load saved category map from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("txnCategories");
      if (saved) {
        setCategoryMap(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to parse txnCategories from localStorage", e);
    }
  }, []);

  const persistCategoryMap = (next) => {
    setCategoryMap(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("txnCategories", JSON.stringify(next));
    }
  };

  // Resolve IDs from auth context
  useEffect(() => {
    const cid = getCustomerId?.() ?? user?.customerId ?? null;
    const acc =
      getDepositAccount?.() ??
      user?.depositAccount ??
      user?.raw?.DepositeAcct ??
      "";

    setCustomerId(cid);
    setAccountId(acc);
  }, [user, getCustomerId, getDepositAccount]);

  const hasAccount = !!customerId && !!accountId;

  // Fetch balance when IDs are ready
  useEffect(() => {
    if (!hasAccount) {
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
  }, [customerId, accountId, hasAccount]);

  // Fetch transactions when IDs, date or reloadToken change
  useEffect(() => {
    if (!hasAccount) {
      setLoadingTx(false);
      setTransactions([]);
      return;
    }

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

    // Sort newest → oldest
    const sorted = [...txs].sort((a, b) => {
      const da = new Date(a.transactionDate || 0).getTime();
      const db = new Date(b.transactionDate || 0).getTime();
      return db - da;
    });

    // 🔎 Ask our backend for known categories for these transactionIds
    const ids = sorted
      .map((tx) => tx.transactionId)
      .filter(Boolean);

    let serverCategories = {};
    try {
      serverCategories = await getTransactionCategories(ids);
    } catch (e) {
      console.warn("Failed to load server categories", e);
    }

    // Merge everything into a single MerchantCategory field
    const enhanced = sorted.map((tx) => {
      const tid = tx.transactionId;
      return {
        ...tx,
        MerchantCategory:
          tx.MerchantCategory ||                   // from API if ever present
          tx.merchantCategory ||                   // any variant
          serverCategories[tid] ||                 // 👈 from our Node store
          categoryMap[tid] ||                      // localStorage fallback
          null,
      };
    });

    setTransactions(enhanced);
  } catch (err) {
    console.error("Transactions fetch error:", err);
    setTxError(err.message || "Failed to load transactions");
    setTransactions([]);
  } finally {
    setLoadingTx(false);
  }
}


    loadTransactions();
  }, [accountId, hasAccount, startDate, endDate, reloadToken, categoryMap]);

  // Helper: format amount with + / - and colour
  const renderAmount = (tx) => {
    const amt = Number(tx.transactionAmount || tx.txnAmt || 0);

    const isCredit =
      tx.accountTo === accountId ||
      String(tx.transactionType) === "200" ||
      tx.Recieving_Acct_Id === accountId;

    const sign = isCredit ? "+" : "-";
    const display = `${sign}$${Math.abs(amt).toFixed(2)}`;
    const colourClass = isCredit ? "text-green-600" : "text-red-600";

    return (
      <span className={`text-right font-semibold ${colourClass}`}>{display}</span>
    );
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

  // Handle ProcessTxn form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!hasAccount) {
      setFormError("No deposit account available for this user.");
      return;
    }
    if (!receivingAcctId) {
      setFormError("Please enter the receiving account ID.");
      return;
    }
    const amtNum = Number(amount);
    if (!amtNum || amtNum <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!category) {
      setFormError("Please select a merchant category.");
      return;
    }

    try {
      setSubmitting(true);

      const txn = await processTransaction({
        customerId,
        custAcctId: accountId,
        receivingAcctId,
        amount: amtNum,
        category,
      });

      // Save category mapping by transactionId
      if (txn?.transactionId && txn?.MerchantCategory) {
        const nextMap = {
          ...categoryMap,
          [txn.transactionId]: txn.MerchantCategory,
        };
        persistCategoryMap(nextMap);
      }

      setFormSuccess(
        `Transaction successful (ID: ${txn?.transactionId || "unknown"})`
      );
      setAmount("");
      // Optionally keep receivingAcctId & category
      setReloadToken((t) => t + 1); // reload history
    } catch (err) {
      console.error("ProcessTxn error:", err);
      setFormError(err.message || "Failed to process transaction.");
    } finally {
      setSubmitting(false);
    }
  };

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

          {/* Process Transaction form */}
          <Card>
            <CardHeader>
              <CardTitle>New Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAccount ? (
                <p className="text-muted-foreground">
                  No deposit account available to create transactions.
                </p>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4 max-w-xl"
                  noValidate
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-muted-foreground mb-1">
                        From account
                      </label>
                      <input
                        type="text"
                        value={accountId}
                        disabled
                        className="border rounded px-2 py-1 bg-muted text-sm cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm text-muted-foreground mb-1">
                        To account
                      </label>
                      <input
                        type="text"
                        className="border rounded px-2 py-1 bg-background text-sm placeholder:text-muted-foreground"
                        value={receivingAcctId}
                        onChange={(e) => setReceivingAcctId(e.target.value)}
                        placeholder="0000005954"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-muted-foreground mb-1">
                        Amount (SGD)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border rounded px-2 py-1 bg-background text-sm placeholder:text-muted-foreground"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="3.00"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm text-muted-foreground mb-1">
                        Category
                      </label>
                      <select
                        className="border rounded px-2 py-1 bg-background text-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Food">Food</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Transport">Transport</option>
                        <option value="Bills">Bills</option>
                        <option value="Withdrawal">Withdrawal</option>
                        <option value="Deposit">Deposit</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>

                  {formError && (
                    <p className="text-sm text-red-500">{formError}</p>
                  )}
                  {formSuccess && (
                    <p className="text-sm text-green-600">{formSuccess}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border bg-foreground text-background hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Processing..." : "Submit Transaction"}
                  </button>
                </form>
              )}
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
                        range or create a new transaction.
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
                      <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                        <span>Date / Time</span>
                        <span>From</span>
                        <span>To</span>
                        <span className="text-right">Amount</span>
                        <span>Currency</span>
                        <span>Payment Mode</span>
                        <span>Category</span>
                      </div>

                      {transactions.map((tx) => (
                        <div
                          key={tx.transactionId}
                          className="grid grid-cols-7 gap-2 text-sm py-2 border-b last:border-b-0"
                        >
                          <span>{formatDateTime(tx.transactionDate)}</span>
                          <span className="truncate">
                            {tx.accountFrom || tx.Cust_Acct_Id || "—"}
                          </span>
                          <span className="truncate">
                            {tx.accountTo || tx.Recieving_Acct_Id || "—"}
                          </span>
                          {renderAmount(tx)}
                          <span>{tx.currency || "SGD"}</span>
                          <span>{tx.paymentMode || "Cash"}</span>
                          <span>{tx.MerchantCategory || "—"}</span>
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
