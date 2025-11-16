import { useState, useEffect, useCallback } from 'react';
import { LoyaltyAPI } from '@/lib/loyalty-api';


export function useLoyaltyBalance(customerId) {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!customerId) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { points } = await LoyaltyAPI.getPoints(customerId);

      setBalance(points);

    } catch (err) {
      console.error('❌ Error in useLoyaltyBalance:', err);
      setError(err.message);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
}