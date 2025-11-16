// === FINAL FIXED VERSION (page.jsx) ===

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
import { Heart, Settings2, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/auth-context";

import { useDonationsByCustomer, useAddDonation } from "@/hooks/useDonations";
import {
  useDonationPreference,
  savePreference,
} from "@/hooks/useDonationPreference";
import { OrganisationsAPI } from "@/lib/organisations-api";

export default function DonationsPage() {
  const { getCustomerId } = useAuth();
  const customerId = getCustomerId();

  const [orgId, setOrgId] = useState("");
  const [amount, setAmount] = useState("");

  const [showPrefModal, setShowPrefModal] = useState(false);
  const [prefOrgId, setPrefOrgId] = useState("");

  const [orgs, setOrgs] = useState([]);
  const [orgsError, setOrgsError] = useState("");
  
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);

  const { donations, refresh: refreshDonations } =
    useDonationsByCustomer(customerId);
  const { add: addDonation } = useAddDonation();

  const { pref, refresh: refreshPref } = useDonationPreference(customerId);

  // ============================================================
  // FINAL ROBUST ORGANISATION NAME MATCHING
  // ============================================================
  function normalise(str) {
    return String(str || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function mapPrefNameToId(pref, orgs) {
    if (!pref || !pref.Organization || !orgs?.length) return "";

    const prefNameRaw = pref.Organization;
    const prefName = normalise(prefNameRaw);

    if (!prefName) return "";

    // 1) Exact match
    let match = orgs.find((o) => normalise(o.Name) === prefName);
    if (match) return String(match.OrganisationId);

    // 2) Contains
    match = orgs.find(
      (o) =>
        normalise(o.Name).includes(prefName) ||
        prefName.includes(normalise(o.Name))
    );
    if (match) return String(match.OrganisationId);

    // 3) Starts-with match
    match = orgs.find(
      (o) =>
        normalise(o.Name).startsWith(prefName) ||
        prefName.startsWith(normalise(o.Name))
    );
    if (match) return String(match.OrganisationId);

    console.warn(
      "⚠️ Could not map OutSystems preference name → organisationId\n",
      "Returned name:",
      prefNameRaw,
      "\nAvailable organisations:",
      orgs.map((o) => o.Name)
    );

    return "";
  }

  // Helper: stable date formatting (no locale-based mismatch)
  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    // Use ISO date (YYYY-MM-DD) so SSR and client match
    return d.toISOString().split("T")[0];
  }

  const [envOrgs, setEnvOrgs] = useState([]);
  useEffect(() => {
    async function load() {
      try {
        const list = await OrganisationsAPI.getEnvOrganisations();
        setEnvOrgs(list);
      } catch (err) {
        console.error("Failed to load environmental orgs", err);
      }
    }
    load();
  }, []);

  // ============================================================
  // LOAD ORGANISATIONS
  // ============================================================
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const res = await fetch("/api/organisations");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load organisations");

        const uniq = [];
        const seen = new Set();

        for (const o of (data.organisations || [])) {
          if (!seen.has(o.OrganisationId)) {
            seen.add(o.OrganisationId);
            uniq.push(o);
          }
        }

        setOrgs(uniq);
      } catch (err) {
        setOrgsError(err.message);
      }
    };

    loadOrgs();
  }, []);

  // ============================================================
  // APPLY SAVED PREFERENCE AFTER REFRESH
  // ============================================================
  useEffect(() => {
    if (!pref || !orgs.length) return;

    const mappedId = mapPrefNameToId(pref, orgs);

    // ✔ Only overwrite if mapping succeeds
    if (mappedId) {
      setOrgId(mappedId);
      setPrefOrgId(mappedId);
    } else {
      console.warn(
        "⚠️ Preference mapping failed — keeping existing dropdown selection."
      );
    }
  }, [pref, orgs]);

  // ============================================================
  // DONATE
  // ============================================================
  const onDonate = async (e) => {
    e.preventDefault();
    if (!customerId || !orgId || !amount) return;

    setDonating(true);
    setDonationSuccess(false);

    try {
      await addDonation({
        customerId,
        orgId: parseInt(orgId, 10),
        amount: Number(amount),
      });

      setAmount("");
      setDonationSuccess(true);
      await refreshDonations();
      
      // Hide success message after 3 seconds
      setTimeout(() => setDonationSuccess(false), 3000);
    } catch (error) {
      console.error("Donation failed:", error);
    } finally {
      setDonating(false);
    }
  };

  // ============================================================
  // SAVE PREFERENCE
  // ============================================================
  const onSavePreference = async () => {
    if (!customerId || !prefOrgId) return;

    // Find the selected organisation's NAME by id
    const selectedOrg = orgs.find(
      (o) => String(o.OrganisationId) === String(prefOrgId)
    );
    const orgName = selectedOrg?.Name || "";

    await savePreference({
      customerId,
      preference: "Yes",
      organization: orgName,
      hasExisting: !!pref,
    });

    // Optimistically update dropdown and modal selection
    setOrgId(prefOrgId);
    setPrefOrgId(prefOrgId);

    setShowPrefModal(false);
  };

  // ============================================================
  // AGGREGATIONS (TOTAL + LATEST)  ✅ NEW LOGIC HERE
  // ============================================================
  const sortedDonations = useMemo(() => {
    if (!Array.isArray(donations)) return [];
    return [...donations].sort((a, b) => {
      const da = new Date(a.date || a.Date || 0).getTime();
      const db = new Date(b.date || b.Date || 0).getTime();
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;
      return db - da; // newest first
    });
  }, [donations]);

  const latestDonation = sortedDonations.length ? sortedDonations[0] : null;

  const totalDonated = useMemo(
    () =>
      Array.isArray(sortedDonations)
        ? sortedDonations.reduce(
            (sum, d) => sum + Number(d.amount || 0),
            0
          )
        : 0,
    [sortedDonations]
  );

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
                const mapped = mapPrefNameToId(pref, orgs);
                if (mapped) setPrefOrgId(mapped);
              }}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Edit Preferences
            </Button>
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Donated */}
            <Card>
              <CardHeader>
                <CardTitle>Total Donated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalDonated.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {sortedDonations.length} donations
                </p>
              </CardContent>
            </Card>

            {/* Latest Donation – now really the latest */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Donation</CardTitle>
              </CardHeader>
              <CardContent>
                {latestDonation ? (
                  <>
                    <div className="text-2xl font-bold">
                      ${Number(latestDonation.amount || 0).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(latestDonation.date || latestDonation.Date)}
                    </p>
                  </>
                ) : (
                  <p>No donations yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Give Today */}
            <Card>
              <CardHeader>
                <CardTitle>Give Today</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={onDonate}>
                  <Label>Organisation</Label>
                  <Select value={orgId || ""} onValueChange={setOrgId}>
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
                    min="0.01"
                    step="0.01"
                    required
                  />

                  {donationSuccess && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Donation successful!
                    </div>
                  )}

                  <Button type="submit" disabled={donating}>
                    {donating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Donate Now
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Donation History – now sorted newest → oldest */}
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedDonations.length ? (
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                  {sortedDonations.map((d) => {
                    const org = orgs.find(
                      (o) => String(o.OrganisationId) === String(d.orgId)
                    );
                    return (
                      <div
                        key={d.id}
                        className="p-4 border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {org?.Name || "Sustainability Fund"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(d.date || d.Date)}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">
                          ${Number(d.amount || 0).toFixed(2)}
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

          {/* Featured Orgs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {envOrgs.map((org) => (
              <Card key={org.id}>
                <CardHeader>
                  <CardTitle>{org.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {org.logoUrl && (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="h-20 mb-4 rounded"
                    />
                  )}

                  <p className="text-sm text-gray-600 mb-2">
                    {org.description}
                  </p>

                  <a
                    href={org.websiteUrl}
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Visit Website
                  </a>

                  <Button
                    type="button"
                    className="w-full mt-4"
                    onClick={() => {
                      const match = orgs.find(
                        (o) => normalise(o.Name) === normalise(org.name)
                      );
                      if (match) setOrgId(String(match.OrganisationId));
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Donate to {org.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          
        </div>
      </main>

      {/* PREFERENCE MODAL */}
      {showPrefModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Donation Preference</CardTitle>
              <CardDescription>
                Select your favourite organisation
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Label>Preferred Organisation</Label>

              <Select value={prefOrgId || ""} onValueChange={setPrefOrgId}>
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
                <Button
                  variant="outline"
                  onClick={() => setShowPrefModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={onSavePreference}>Save Preference</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
