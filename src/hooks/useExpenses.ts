'use client';

import { useState, useEffect, useCallback } from 'react';
import { getExpenses, getCategories } from '@/services/expenses';
import { buildMonthlySummaries } from '@/lib/utils';
import type { ExpenseCategory, ExpenseWithCategory, MonthlyExpenseSummary } from '@/types';

interface UseExpensesReturn {
  expenses: ExpenseWithCategory[];
  categories: ExpenseCategory[];
  monthlySummaries: MonthlyExpenseSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useExpenses(): UseExpensesReturn {
  const [expenses, setExpenses]     = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exp, cats] = await Promise.all([getExpenses(), getCategories()]);
      setExpenses(exp);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const monthlySummaries = buildMonthlySummaries(expenses);

  return { expenses, categories, monthlySummaries, loading, error, refresh };
}
