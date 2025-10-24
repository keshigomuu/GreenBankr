"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, Factory, ShoppingCart, Car, Coffee, Plane } from "lucide-react";
import { ensureCustomerId } from "@/lib/utils";
import { useCarbonImpact, useCreateCarbonImpact } from "@/hooks/useCarbonImpact";

const categories = [
  { id: "Groceries", name: "Groceries", icon: ShoppingCart },
  { id: "Dining", name: "Dining", icon: Coffee },
  { id: "Transport", name: "Transport", icon: Car },
  { id: "Flights", name: "Flights", icon: Plane },
  { id: "Utilities", name: "Utilities", icon: Factory },
];

function pickIcon(cat) {
  const found = categories.find((c) => c.id === cat || c.name === cat);
  return found?.icon || Leaf;
}

export default function ImpactPage() {
  const [userId, setUserId] = useState(null);
  useEffect(() => { setUserId(ensureCustomerId()); }, []);

  const { totalCarbonKg, transactions, loading, error, refresh } = useCarbonImpact(userId);
  const { create, loading: creating, error: createErr } = useCreateCarbonImpact();

  const [merchantCategory, setCat] = useState("");
  const [amount, setAmount] = useState("");

  const lastTxn = transactions?.[0] || null;

  const totalTons = useMemo(() => (Number(totalCarbonKg) / 1000).toFixed(3), [totalCarbonKg]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!userId || !merchantCategory || !amount) return;
    await create({ userId, merchantCategory, amount: Number(amount) });
    setAmount("");
    setCat("");
    refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Carbon Impact</h1>
            <p className="text-muted-foreground mt-1">
              Track your estimated CO₂ footprint: 
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total CO₂</CardTitle>
                <Leaf className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTons} t</div>
                <p className="text-xs text-muted-foreground mt-1">{Number(totalCarbonKg).toFixed(1)} kg</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Latest Activity</CardTitle>
                <Factory className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : lastTxn ? (
                  <>
                    <div className="text-2xl font-bold">{Number(lastTxn.carbonKg).toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(lastTxn.transactionDate || Date.now()).toLocaleDateString()} •{" "}
                      {lastTxn.merchantCategory || "Activity"}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">No carbon activities yet.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Add Activity</CardTitle>
                <ShoppingCart className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={onSubmit}>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <Label className="text-xs">Merchant Category</Label>
                      <Select value={merchantCategory} onValueChange={setCat}>
                        <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Amount (SGD)</Label>
                      <Input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="20.00"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={creating || !merchantCategory || !amount || !userId}>
                    {creating ? "Saving..." : "Record Activity"}
                  </Button>
                  {createErr && <p className="text-xs text-red-600 mt-1">Failed: {String(createErr.message || createErr)}</p>}
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Your recent carbon-impacting transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading your carbon impact…</div>
              ) : error ? (
                <div className="p-6 text-sm text-red-600">
                  Failed to load impact: {String(error.message || error)}
                </div>
              ) : transactions?.length ? (
                <div className="space-y-3">
                  {transactions.map((t) => {
                    const Icon = pickIcon(t.merchantCategory);
                    return (
                      <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{t.merchantCategory || "Activity"}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{t.transactionDate ? new Date(t.transactionDate).toLocaleDateString() : "-"}</span>
                              <span>•</span>
                              <span>${Number(t.amount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">{Number(t.carbonKg || 0).toFixed(1)} kg</p>
                          <p className="text-xs text-muted-foreground">{Number(t.carbonIntensity || 0).toFixed(2)} kg/$</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-sm text-muted-foreground border rounded-lg">
                  No carbon activities recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
