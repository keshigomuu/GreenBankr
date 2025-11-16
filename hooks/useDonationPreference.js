"use client";

import { useCallback, useEffect, useState } from "react";

export function useDonationPreference(customerId) {
  const [pref, setPref] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPref = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/preferences?customerId=${customerId}`, {
        cache: "no-store",
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      // OutSystems returns:
      // { Id, Customer_ID, Preference, Organization }
      if (data && typeof data === "object") {
        setPref(data);
      } else {
        setPref(null);
      }
    } catch (err) {
      console.warn("Preference fetch error ignored:", err);
      setPref(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchPref();
  }, [fetchPref]);

  return { pref, loading, refresh: fetchPref };
}

export async function savePreference({
  customerId,
  preference,
  organization,
  hasExisting,
}) {
  if (!customerId) throw new Error("Missing customerId");
  
  // Organization is only required when preference is "Yes"
  if (preference === "Yes" && !organization) {
    throw new Error("Missing organisation name");
  }

  const endpoint = hasExisting
    ? "/api/preferences/update"
    : "/api/preferences/add";

  const method = hasExisting ? "PUT" : "POST";

  // 🚨 Important: send EXACTLY what OutSystems expects
  const payload = {
    customerId,
    preference,   // e.g. "Yes" or "No"
  };

  // Only include organization if preference is "Yes"
  if (preference === "Yes" && organization) {
    payload.organization = organization;
  }

  const res = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || (data && data.Success === false)) {
    const msg =
      data?.ErrorMessage ||
      data?.error ||
      `Failed to ${hasExisting ? "update" : "add"} preference`;
    throw new Error(msg);
  }

  return data;
}
