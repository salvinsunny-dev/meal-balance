'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import MealForm from '@/components/meals/MealForm';
import PaymentForm from '@/components/payments/PaymentForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import { useBalance } from '@/hooks/useBalance';
import { deleteMeal } from '@/services/meals';
import { deletePayment } from '@/services/payments';
import {
  buildLedger, groupByDate, formatDate, formatTime,
  formatCurrency, todayString, startOfWeek, startOfMonth,
} from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { FilterPeriod, FilterType, LedgerEntry, Meal, Payment } from '@/types';

const PERIODS: { label: string; value: FilterPeriod }[] = [
  { label: 'Today',     value: 'today'  },
  { label: 'This week', value: 'week'   },
  { label: 'This month',value: 'month'  },
  { label: 'All time',  value: 'all'    },
  { label: 'Custom',    value: 'custom' },
];

const TYPES: { label: string; value: FilterType }[] = [
  { label: 'All',      value: 'all'      },
  { label: 'Meals',    value: 'meals'    },
  { label: 'Payments', value: 'payments' },
];

export default function HistoryPage() {
  const { meals, payments, summary, loading, error, refresh } = useBalance();
  const [period, setPeriod]         = useState<FilterPeriod>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo]     = useState('');
  const [editingMeal, setEditingMeal]       = useState<Meal | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingEntry, setDeletingEntry]   = useState<LedgerEntry | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [actionError, setActionError]       = useState('');
  const { currency } = DEFAULT_SETTINGS;
  const today = todayString();

  const filteredEntries = useMemo(() => {
    const ledger = buildLedger(meals, payments);
    const dateFiltered = ledger.filter((e) => {
      if (period === 'today')  return e.date === today;
      if (period === 'week')   return e.date >= startOfWeek(today) && e.date <= today;
      if (period === 'month')  return e.date >= startOfMonth(today) && e.date <= today;
      if (period === 'custom') {
        if (customFrom && e.date < customFrom) return false;
        if (customTo   && e.date > customTo)   return false;
        return true;
      }
      return true;
    });
    return dateFiltered.filter((e) => {
      if (filterType === 'meals')    return e.type === 'meal';
      if (filterType === 'payments') return e.type === 'payment';
      return true;
    });
  }, [meals, payments, period, filterType, today, customFrom, customTo]);

  const grouped = useMemo(() => groupByDate(filteredEntries), [filteredEntries]);

  const handleDeleteEntry = useCallback(async () => {
    if (!deletingEntry) return;
    setDeleting(true);
    setActionError('');
    try {
      if (deletingEntry.type === 'meal') await deleteMeal(deletingEntry.id);
      else await deletePayment(deletingEntry.id);
      setDeletingEntry(null);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }, [deletingEntry, refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading history…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader title="History" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {error && <Alert message={error} />}

        {/* Period pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${
                period === p.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {period === 'custom' && (
          <div className="flex gap-3">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
            <input type="date" value={customTo} max={today} onChange={(e) => setCustomTo(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
          </div>
        )}

        {/* Type filter */}
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold border transition-all ${
                filterType === t.value
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 px-1">
          {filteredEntries.length} record{filteredEntries.length !== 1 ? 's' : ''}
        </p>

        {actionError && <Alert message={actionError} />}

        {grouped.size === 0 ? (
          <Card>
            <div className="text-center py-10 space-y-2">
              <p className="text-4xl">📭</p>
              <p className="text-sm font-medium text-gray-700">No records found</p>
              <p className="text-xs text-gray-400">Try a different filter.</p>
            </div>
          </Card>
        ) : (
          Array.from(grouped.entries()).map(([date, entries]) => (
            <div key={date} className="space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                {formatDate(date)}
              </p>
              <Card padding="none">
                <ul className="divide-y divide-gray-50">
                  {entries.map((entry) => (
                    <li key={`${entry.type}-${entry.id}`} className="flex items-center gap-3 px-4 py-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                        entry.type === 'meal' ? 'bg-indigo-50' : 'bg-emerald-50'
                      }`}>
                        {entry.type === 'meal' ? '🍽️' : '💸'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{entry.label}</p>
                        <p className="text-xs text-gray-400">{formatTime(entry.time)}</p>
                        {entry.note && <p className="text-xs text-gray-400 truncate">{entry.note}</p>}
                      </div>

                      <span className={`text-sm font-bold shrink-0 ${
                        entry.amount > 0 ? 'text-gray-800' : 'text-emerald-600'
                      }`}>
                        {entry.amount > 0
                          ? `+${formatCurrency(entry.amount, currency)}`
                          : `−${formatCurrency(Math.abs(entry.amount), currency)}`}
                      </span>

                      <button
                        onClick={() => {
                          if (entry.type === 'meal') {
                            const m = meals.find((x) => x.id === entry.id);
                            if (m) setEditingMeal(m);
                          } else {
                            const p = payments.find((x) => x.id === entry.id);
                            if (p) setEditingPayment(p);
                          }
                        }}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 shrink-0 transition-colors"
                        aria-label="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeletingEntry(entry)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors"
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
            </div>
          ))
        )}
      </main>

      <MealForm open={!!editingMeal} onClose={() => setEditingMeal(null)} onSuccess={refresh} editMeal={editingMeal} />
      <PaymentForm open={!!editingPayment} onClose={() => setEditingPayment(null)} onSuccess={refresh} outstandingBalance={summary.outstanding_balance} editPayment={editingPayment} />
      <ConfirmDialog
        open={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDeleteEntry}
        title={`Delete ${deletingEntry?.type}?`}
        message={
          deletingEntry?.type === 'meal'
            ? `Remove this ${deletingEntry.label} record? Balance will decrease by ₹50.`
            : `Remove payment of −${formatCurrency(Math.abs(deletingEntry?.amount ?? 0), currency)}? Balance will increase.`
        }
        loading={deleting}
      />
    </>
  );
}
