"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Points are derived from total donations:
 *   $1 donated = 1 point (lifetime).
 * This hook returns { points, loading, error, refresh }
 * where `points` is the *lifetime donated points*.
 */
export function useLoyaltyPoints(customerId) {
  const [points, setPoints] = useState(undefined);
  const [loading, setLoading] = useState(Boolean(customerId));
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!customerId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/donations/by-customer?customerId=${encodeURIComponent(customerId)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({ donations: [] }));
        // Our server route returns 200 with {donations: []} on "no data"
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j?.donations || [];
      })
      .then((donations) => {
        const total = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);
        setPoints(total); // lifetime donated points
      })
      .catch((e) => {
        setError(e);
        setPoints(0);
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Always expose a number
  return { points: points ?? 0, loading, error, refresh };
}
