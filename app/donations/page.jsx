"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, TreePine, Droplet, Wind, Users } from "lucide-react";
import { ensureCustomerIds, ensureNumericCustomerId } from "@/lib/utils";
import { useDonationsByCustomer, useAddDonation } from "@/hooks/useDonations";

const organizations = [
  { id: 1, name: "Ocean Cleanup Initiative", icon: Droplet, category: "Environment" },
  { id: 2, name: "Reforestation Project", icon: TreePine, category: "Climate" },
  { id: 3, name: "Clean Air Campaign", icon: Wind, category: "Environment" },
  { id: 4, name: "Community Gardens", icon: Users, category: "Community" },
];

export default function DonationsPage() {
  const [customer, setCustomer] = useState({ id: null, intId: null });

  useEffect(() => {
    setCustomer(ensureCustomerIds()); // { id: "user_xxx", intId: number }
  }, []);

  // Load donation history using the numeric id
  const { donations, loading, error, refresh } = useDonationsByCustomer(customer.intId);

  // Donate form
  const [orgId, setOrgId] = useState("");
  const [amount, setAmount] = useState("");
  const { add, loading: adding, error: addError } = useAddDonation();

  const totalDonated = useMemo(
    () => (Array.isArray(donations) ? donations.reduce((s, d) => s + Number(d.amount || 0), 0) : 0),
    [donations]
  );

  const onDonate = async (e) => {
    e.preventDefault();
    const numericCustomerId = ensureNumericCustomerId();
    if (!numericCustomerId || !orgId || !amount) return;
    await add({ customerId: numericCustomerId, orgId: parseInt(orgId, 10), amount: Number(amount) });
    setAmount("");
    setOrgId("");
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Donations</h1>
            <p className="text-muted-foreground mt-1">
              Support causes you care about {customer.intId ? `(ID ${customer.intId})` : ""}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Donated</CardTitle>
                <Heart className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalDonated.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {loading ? "Loading…" : `Across ${donations?.length || 0} donations`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Latest Donation</CardTitle>
                <TreePine className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : donations?.length ? (
                  <>
                    <div className="text-2xl font-bold">
                      ${Number(donations[0].amount).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(donations[0].date || Date.now()).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">No donations made.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Give Today</CardTitle>
                <Wind className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={onDonate}>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <Label className="text-xs">Organization</Label>
                      <Select value={orgId} onValueChange={setOrgId}>
                        <SelectTrigger><SelectValue placeholder="Choose charity" /></SelectTrigger>
                        <SelectContent>
                          {organizations.map((o) => (
                            <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
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
                        placeholder="10.00"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={adding || !orgId || !amount || !customer.intId}>
                    <Heart className="w-4 h-4 mr-2" />
                    {adding ? "Processing..." : "Donate Now"}
                  </Button>
                  {addError && (
                    <p className="text-xs text-red-600">
                      Failed to donate: {String(addError.message || addError)}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Featured Orgs */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Organizations</CardTitle>
              <CardDescription>Choose where your donations make an impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organizations.map((org) => {
                  const Icon = org.icon;
                  return (
                    <div
                      key={org.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">{org.name}</h3>
                          <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {org.category}
                          </span>
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => { setOrgId(String(org.id)); }}>
                        <Heart className="w-4 h-4 mr-2" />
                        Donate to {org.name}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Donation History */}
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
              <CardDescription>Your recent contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading your donations…</div>
              ) : error ? (
                <div className="p-6 text-sm text-red-600">
                  Failed to load donations: {String(error.message || error)}
                </div>
              ) : donations?.length ? (
                <div className="space-y-3">
                  {donations.map((d) => {
                    const OrgIcon = organizations.find((o) => String(o.id) === String(d.orgId))?.icon || Heart;
                    return (
                      <div key={d.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <OrgIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {organizations.find((o) => String(o.id) === String(d.orgId))?.name || "Organization"}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{d.date ? new Date(d.date).toLocaleDateString() : "-"}</span>
                              <span>•</span>
                              <span>Service</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">${Number(d.amount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-sm text-muted-foreground border rounded-lg">
                  No donations made.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
