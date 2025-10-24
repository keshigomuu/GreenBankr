"use client";

import { useCallback, useEffect, useState } from "react";

export function useCarbonImpact(userId) {
  const [data, setData] = useState({ totalCarbonKg: 0, transactions: [], userId });
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/carbon/by-user?userId=${encodeURIComponent(userId)}`)
      .then(async (r) => {
        const body = await r.text();
        if (!r.ok) {
          try {
            const j = JSON.parse(body);
            throw new Error(j?.error || `HTTP ${r.status}`);
          } catch {
            throw new Error(body.slice(0, 180));
          }
        }
        return JSON.parse(body);
      })
      .then((d) => setData(d))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...data, loading, error, refresh };
}

export function useCreateCarbonImpact() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async ({ userId, merchantCategory, amount }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/carbon/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, merchantCategory, amount }),
      });
      const body = await res.text();
      const j = body ? JSON.parse(body) : {};
      if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
      return j;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}
