'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMeals } from '@/services/meals';
import { getPayments } from '@/services/payments';
import { calculateBalance } from '@/lib/utils';
import type { Meal, Payment, BalanceSummary } from '@/types';

interface UseBalanceReturn {
  meals: Meal[];
  payments: Payment[];
  summary: BalanceSummary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const EMPTY_SUMMARY: BalanceSummary = {
  total_meals: 0,
  total_meal_amount: 0,
  total_payments: 0,
  outstanding_balance: 0,
};

export function useBalance(): UseBalanceReturn {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, p] = await Promise.all([getMeals(), getPayments()]);
      setMeals(m);
      setPayments(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = calculateBalance(meals, payments);

  return { meals, payments, summary, loading, error, refresh };
}
