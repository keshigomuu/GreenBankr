"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Fetch donations for a customer.
 * Any 404/204/500 from our server route is normalized to [] (no error).
 */
export function useDonationsByCustomer(customerId) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(Boolean(customerId));
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/donations/by-customer?customerId=${encodeURIComponent(customerId)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          const status = r.status;
          const msg = String(body?.error || "");
          // Normalize “no data” to empty list
          if (
            status === 404 ||
            status === 204 ||
            status === 500 ||
            /no donations|not found|empty/i.test(msg)
          ) {
            return { donations: [] };
          }
          throw new Error(msg || `HTTP ${status}`);
        }
        return body;
      })
      .then((d) => setDonations(d.donations || []))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { donations, loading, error, refresh };
}

export function useAddDonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const add = useCallback(async ({ customerId, amount, orgId }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donations/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, amount, orgId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      return j; // { donationId }
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { add, loading, error };
}

export function useOrganisations() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/organisations")
      .then((r) => r.json())
      .then((d) => setOrgs(d?.organisations || []))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, []);

  return { orgs, loading, error };
}
