'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import CategoryManager from '@/components/expenses/CategoryManager';
import { useExpenses } from '@/hooks/useExpenses';
import { deleteExpense } from '@/services/expenses';
import {
  formatCurrency,
  formatDate,
  currentMonthKey,
  formatMonthLabel,
} from '@/lib/utils';
import { MONTHS } from '@/lib/constants';
import type { ExpenseWithCategory } from '@/types';

export default function ExpensesPage() {
  const { expenses, categories, monthlySummaries, loading, error, refresh } = useExpenses();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [addOpen, setAddOpen]             = useState(false);
  const [editExpense, setEditExpense]     = useState<ExpenseWithCategory | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<ExpenseWithCategory | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [actionError, setActionError]     = useState('');

  // Expenses for selected month
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.expense_date.startsWith(selectedMonth)),
    [expenses, selectedMonth],
  );

  const monthTotal = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses],
  );

  // Available months from data, plus current month always present
  const availableMonths = useMemo(() => {
    const keys = new Set(expenses.map((e) => e.expense_date.slice(0, 7)));
    keys.add(currentMonthKey());
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setActionError('');
    try {
      await deleteExpense(deleteTarget.id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading expenses…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Expenses" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {error && <Alert message={error} />}
        {actionError && <Alert message={actionError} />}

        {/* Month selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {availableMonths.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                selectedMonth === m
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {formatMonthLabel(m)}
            </button>
          ))}
        </div>

        {/* Month summary card */}
        <div className="rounded-2xl p-5 gradient-expense text-white shadow-lg">
          <p className="text-green-100 text-sm font-medium uppercase tracking-widest mb-1">
            {formatMonthLabel(selectedMonth)}
          </p>
          <p className="text-4xl font-bold tracking-tight mb-4">
            {formatCurrency(monthTotal)}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-green-100 text-xs">Expenses</p>
              <p className="text-white font-bold text-sm mt-0.5">{monthExpenses.length}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-green-100 text-xs">Average</p>
              <p className="text-white font-bold text-sm mt-0.5">
                {monthExpenses.length > 0
                  ? formatCurrency(Math.round(monthTotal / monthExpenses.length))
                  : '₹0'}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            fullWidth
            size="lg"
            onClick={() => { setEditExpense(null); setAddOpen(true); }}
            disabled={categories.length === 0}
          >
            + Add Expense
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setCatManagerOpen(true)}
            aria-label="Manage categories"
          >
            🏷️
          </Button>
        </div>

        {/* Category breakdown */}
        {monthExpenses.length > 0 && (
          <CategoryBreakdown expenses={monthExpenses} total={monthTotal} />
        )}

        {/* Expense list */}
        {monthExpenses.length === 0 ? (
          <Card>
            <div className="text-center py-10 space-y-2">
              <p className="text-4xl">💸</p>
              <p className="text-sm font-medium text-gray-700">No expenses for {formatMonthLabel(selectedMonth)}</p>
              <p className="text-xs text-gray-400">Tap &ldquo;+ Add Expense&rdquo; to start tracking.</p>
            </div>
          </Card>
        ) : (
          <Card padding="none">
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">All Expenses</p>
              <p className="text-xs text-gray-400">{monthExpenses.length} items</p>
            </div>
            <ul className="divide-y divide-gray-100">
              {monthExpenses.map((expense) => (
                <li key={expense.id} className="flex items-center gap-3 px-4 py-3">
                  {/* Category dot */}
                  <div className={`h-10 w-10 rounded-xl ${expense.category.color} flex items-center justify-center text-xl shrink-0`}>
                    {expense.category.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{expense.category.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(expense.expense_date)}
                      {expense.note && ` · ${expense.note}`}
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-gray-800 shrink-0">
                    {formatCurrency(expense.amount)}
                  </span>

                  <button
                    onClick={() => setEditExpense(expense)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                    aria-label="Edit"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(expense)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    aria-label="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>

      {/* Modals */}
      <ExpenseForm
        open={addOpen || !!editExpense}
        onClose={() => { setAddOpen(false); setEditExpense(null); }}
        onSuccess={refresh}
        categories={categories}
        editExpense={editExpense}
      />

      <CategoryManager
        open={catManagerOpen}
        onClose={() => setCatManagerOpen(false)}
        categories={categories}
        onRefresh={refresh}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete expense?"
        message={`Delete ₹${deleteTarget?.amount} ${deleteTarget?.category.name} expense on ${deleteTarget?.expense_date}? This cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}

// ── Category breakdown sub-component ─────────────────────────────────────────
function CategoryBreakdown({
  expenses,
  total,
}: {
  expenses: ExpenseWithCategory[];
  total: number;
}) {
  // Group by category
  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; color: string; total: number }>();
    for (const e of expenses) {
      const prev = map.get(e.category_id) ?? { name: e.category.name, icon: e.category.icon, color: e.category.color, total: 0 };
      map.set(e.category_id, { ...prev, total: prev.total + e.amount });
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <Card>
      <p className="text-sm font-semibold text-gray-900 mb-3">By Category</p>
      <ul className="space-y-3">
        {byCategory.map((cat) => {
          const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
          return (
            <li key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{pct}%</span>
                  <span className="text-sm font-semibold text-gray-800">{formatCurrency(cat.total)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
