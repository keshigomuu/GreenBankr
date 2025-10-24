"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Returns a normalized numeric `points` (always a number).
 */
export function useLoyaltyPoints(customerId) {
  // keep `undefined` until we fetch; never keep `null`
  const [points, setPoints] = useState(undefined);
  const [loading, setLoading] = useState(Boolean(customerId));
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/loyalty/points?customerId=${encodeURIComponent(customerId)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((d) => setPoints(Number(d.points ?? 0)))
      .catch((e) => {
        setError(e);
        // ensure we still return a number to the UI
        setPoints(0);
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Always expose a number
  return { points: points ?? 0, loading, error, refresh };
}
