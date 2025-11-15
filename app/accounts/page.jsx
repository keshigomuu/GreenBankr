"use client";

import { useEffect, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { getDepositBalance } from "@/lib/account-api";

export default function AccountsPage() {
  const { user, getCustomerId, getDepositAccount } = useAuth();
  const customerId = getCustomerId();
  const accountId = getDepositAccount();

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId || !accountId) return;

    async function loadBalance() {
      try {
        const b = await getDepositBalance(customerId, accountId);
        setBalance(b);
      } catch (err) {
        console.error("Balance fetch error:", err);
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

          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading balance...</p>
              ) : (
                <p className="text-4xl font-bold text-foreground">
                  ${balance?.toFixed(2)}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                Account ID: {accountId}
              </p>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
