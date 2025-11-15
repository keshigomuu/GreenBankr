"use client";

import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Settings2 } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import {
  useDonationsByCustomer,
  useAddDonation,
} from "@/hooks/useDonations";

import {
  useDonationPreference,
  savePreference,
} from "@/hooks/useDonationPreference";

export default function DonationsPage() {
  const { getCustomerId } = useAuth();
  const customerId = getCustomerId();

  // Organisations
  const [orgs, setOrgs] = useState([]);
  const [orgsError, setOrgsError] = useState("");

  // Donation hooks
  const {
    donations,
    loading: loadingDonations,
    error: donationError,
    refresh: refreshDonations,
  } = useDonationsByCustomer(customerId);

  const { add: addDonation, loading: addingDonation } = useAddDonation();

  // Donation form
  const [orgId, setOrgId] = useState("");
  const [amount, setAmount] = useState("");

  // Preference modal
  const [showPrefModal, setShowPrefModal] = useState(false);

  const {
    pref,
    loading: loadingPref,
    refresh: refreshPref,
  } = useDonationPreference(customerId);

  // Load organisations
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const res = await fetch("/api/organisations");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to load organisations");

        setOrgs(data.organisations || []);
      } catch (err) {
        setOrgsError(err.message);
      }
    };

    loadOrgs();
  }, []);

  const totalDonated = useMemo(
    () =>
      Array.isArray(donations)
        ? donations.reduce((sum, d) => sum + Number(d.amount || 0), 0)
        : 0,
    [donations]
  );

  // Submit donation
  const onDonate = async (e) => {
    e.preventDefault();
    if (!customerId || !orgId || !amount) return;

    await addDonation({
      customerId,
      orgId: parseInt(orgId, 10),
      amount: Number(amount),
    });

    setAmount("");
    setOrgId("");
    refreshDonations();
  };

  // Save preference (ADD or UPDATE handled in savePreference)
  const onSavePreference = async () => {
    if (!customerId || !orgId) return;

    await savePreference({
      customerId,
      preference: orgId,       // choosing organisation as preference
      organization: orgId,
      hasExisting: !!pref,
    });

    refreshPref();
    setShowPrefModal(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Donations</h1>
              <p className="text-muted-foreground">
                Support causes you care about (ID {customerId})
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setShowPrefModal(true);
                setOrgId(pref?.Organization?.toString() || "");
              }}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Edit Preferences
            </Button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Donated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalDonated.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Across {donations?.length || 0} donations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Donation</CardTitle>
              </CardHeader>
              <CardContent>
                {donations?.length ? (
                  <>
                    <div className="text-2xl font-bold">
                      ${Number(donations[0].amount).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(donations[0].date).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p>No donations yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Donate */}
            <Card>
              <CardHeader>
                <CardTitle>Give Today</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={onDonate}>
                  <Label>Organisation</Label>
                  <Select value={orgId} onValueChange={setOrgId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs.map((o) => (
                        <SelectItem
                          key={o.OrganisationId}
                          value={String(o.OrganisationId)}
                        >
                          {o.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label>Amount</Label>
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    min="1"
                    required
                  />

                  <Button type="submit" disabled={addingDonation}>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate Now
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* FEATURED ORGS */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Organisations</CardTitle>
            </CardHeader>
            <CardContent>
              {orgsError ? (
                <p className="text-red-500">{orgsError}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orgs.map((o) => (
                    <div
                      key={o.OrganisationId}
                      className="p-4 border rounded-lg hover:bg-muted transition"
                    >
                      <div className="font-semibold">{o.Name}</div>
                      <Button
                        className="mt-3 w-full"
                        onClick={() => setOrgId(String(o.OrganisationId))}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Donate to {o.Name}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DONATION HISTORY */}
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
            </CardHeader>
            <CardContent>
              {donations?.length ? (
                <div className="space-y-3">
                  {donations.map((d) => {
                    const org = orgs.find(
                      (o) => String(o.OrganisationId) === String(d.orgId)
                    );

                    return (
                      <div
                        key={d.id}
                        className="p-4 border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{org?.Name || "Organisation"}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(d.date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">
                          ${Number(d.amount).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No donations yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* EDIT PREF MODAL */}
      {showPrefModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Donation Preference</CardTitle>
              <CardDescription>Select your favourite organisation</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Label>Preferred Organisation</Label>
              <Select
                value={orgId}
                onValueChange={setOrgId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose organisation" />
                </SelectTrigger>
                <SelectContent>
                  {orgs.map((o) => (
                    <SelectItem
                      key={o.OrganisationId}
                      value={String(o.OrganisationId)}
                    >
                      {o.Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowPrefModal(false)}>
                  Cancel
                </Button>

                <Button onClick={onSavePreference}>
                  Save Preference
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}
