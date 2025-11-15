"use client";

import { useEffect, useState } from "react";

export function useDonationPreference(customerId) {
  const [pref, setPref] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!customerId) return;
    setLoading(true);
    const r = await fetch(
      `/api/donations/preferences?customerId=${customerId}`
    );
    const j = await r.json();
    setPref(j.preference || null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [customerId]);

  return { pref, refresh, loading };
}

export async function savePreference({ customerId, preference, organization, hasExisting }) {
  const url = hasExisting
    ? "/api/donations/preferences/update"
    : "/api/donations/preferences/add";

  const res = await fetch(url, {
    method: hasExisting ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, preference, organization }),
  });

  const j = await res.json();
  if (!j.success) throw new Error(j.error);
  return j;
}
