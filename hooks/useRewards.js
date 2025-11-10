"use client";

import { useCallback, useEffect, useState } from "react";

export function useRewardsCatalog(active = true) {
  const [data, setData] = useState({ rewards: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/rewards/catalog?active=${active}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((d) => setData(d))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [active]);

  useEffect(() => { refresh(); }, [refresh]);
  return { ...data, loading, error, refresh };
}

export function useMyClaims(customerId) {
  const [data, setData] = useState({ claims: [] });
  const [loading, setLoading] = useState(Boolean(customerId));
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/rewards/claims?customerId=${encodeURIComponent(customerId)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          // Normalize “no data” from server route to empty list
          if (r.status === 404 || r.status === 204 || r.status === 500 || /no data|not found|empty/i.test(j?.error || "")) {
            return { claims: [] };
          }
          throw new Error(j?.error || `HTTP ${r.status}`);
        }
        return j;
      })
      .then((d) => setData(d))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [customerId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { ...data, loading, error, refresh };
}

export function useClaimReward() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const claim = useCallback(async ({ customerId, rewardId }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, rewardId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      return j; // { claimId }
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { claim, loading, error };
}
