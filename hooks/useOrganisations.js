"use client";

import { useCallback, useEffect, useState } from "react";

export function useOrganisations() {
  const [organisations, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setErr(null);
    fetch("/api/organisations/all")
      .then(async (r) => {
        const ct = r.headers.get("content-type") || "";
        const body = await r.text();
        if (!r.ok) {
          // try to parse JSON error; otherwise pass through text/html snippet
          try {
            const j = JSON.parse(body);
            throw new Error(j?.error || `HTTP ${r.status}`);
          } catch {
            throw new Error(body.slice(0, 180));
          }
        }
        if (!ct.toLowerCase().includes("application/json")) {
          throw new Error(`Non-JSON response: ${body.slice(0, 180)}`);
        }
        return JSON.parse(body);
      })
      .then((d) => setOrgs(Array.isArray(d.organisations) ? d.organisations : []))
      .catch((e) => setErr(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { organisations, loading, error, refresh };
}
