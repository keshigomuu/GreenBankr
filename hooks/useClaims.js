import { useState, useEffect, useCallback } from 'react';

export function useMyClaims(customerId) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClaims = useCallback(async () => {
    if (!customerId) {
      setClaims([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/claims?customerId=${customerId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch claims: ${response.status}`);
      }

      const data = await response.json();
      setClaims(data.claims || []);

    } catch (err) {
      console.error('❌ Error fetching claims:', err);
      setError(err.message);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return {
    claims,
    loading,
    error,
    refresh: fetchClaims,
  };
}