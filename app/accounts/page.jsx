"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getDepositBalance } from "@/lib/account-api";

export default function AccountsPage() {
  const { user, getCustomerId, getDepositAccount } = useAuth();

  const [customerId, setCustomerId] = useState(null);
  const [accountId, setAccountId] = useState("");
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      // If we don't have IDs, stop "loading..." to avoid infinite spinner
      setLoading(false);
      return;
    }

    async function loadBalance() {
      try {
        setLoading(true);
        setError("");
        const b = await getDepositBalance(customerId, accountId);
        setBalance(b);
      } catch (err) {
        console.error("Balance fetch error:", err);
        setError(err.message || "Failed to load balance");
      } finally {
        setLoading(false);
      }
    }

    loadBalance();
  }, [customerId, accountId]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="text-muted-foreground">
            Overview of your GreenBankr deposit account
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm text-red-500 mb-2">
                  {error}
                </p>
              )}

              {!customerId || !accountId ? (
                <p className="text-muted-foreground">
                  No deposit account found for this user. Try signing up again
                  or check that signup is returning <code>DepositeAcct</code>.
                </p>
              ) : loading ? (
                <p className="text-muted-foreground">Loading balance...</p>
              ) : (
                <p className="text-4xl font-bold text-foreground">
                  ${Number(balance).toFixed(2)}
                </p>
              )}

              <p className="mt-2 text-sm text-muted-foreground">
                Account ID: {accountId || "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
