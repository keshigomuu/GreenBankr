"use client";

import { useCallback, useEffect, useState } from "react";

export function useDonationsByCustomer(customerIdInt) {
  const [data, setData] = useState({ donations: [] });
  const [loading, setLoading] = useState(Boolean(customerIdInt));
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!customerIdInt) return;
    setLoading(true);
    setError(null);
    fetch(`/api/donations/by-customer?customerId=${encodeURIComponent(customerIdInt)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((d) => setData(d))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [customerIdInt]);

  useEffect(() => { refresh(); }, [refresh]);
  return { ...data, loading, error, refresh };
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
        body: JSON.stringify({ customerId, amount, orgId }), // customerId must already be numeric
      });
      const j = await res.json();
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
