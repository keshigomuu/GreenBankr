"use client";

import { useCallback, useEffect, useState } from "react";

export function useRewardsCatalog(active = true) {
  const [data, setData] = useState({ rewards: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    fetch(`/api/rewards/catalog?active=${active}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((d) => !cancel && setData(d))
      .catch((e) => !cancel && setError(e))
      .finally(() => !cancel && setLoading(false));
    return () => (cancel = true);
  }, [active]);

  return { ...data, loading, error };
}

export function useMyClaims(customerId) {
  const [data, setData] = useState({ claims: [] });
  const [loading, setLoading] = useState(Boolean(customerId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!customerId) return;
    let cancel = false;
    setLoading(true);
    setError(null);
    fetch(`/api/rewards/claims?customerId=${encodeURIComponent(customerId)}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((d) => !cancel && setData(d))
      .catch((e) => !cancel && setError(e))
      .finally(() => !cancel && setLoading(false));
    return () => (cancel = true);
  }, [customerId]);

  return { ...data, loading, error };
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
      const j = await res.json();
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
