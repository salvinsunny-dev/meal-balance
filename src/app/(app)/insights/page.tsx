'use client';
export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { useExpenses } from '@/hooks/useExpenses';
import { useBalance } from '@/hooks/useBalance';
import {
  formatCurrency,
  currentMonthKey,
  formatMonthLabel,
  percentChange,
} from '@/lib/utils';
import { MEAL_TYPES, MEAL_ICONS } from '@/lib/constants';
import type { MealType } from '@/types';

export default function InsightsPage() {
  const { monthlySummaries, loading: expLoading, error: expError } = useExpenses();
  const { meals, payments, summary, loading: mealLoading } = useBalance();
  const [compareMode, setCompareMode] = useState<'expenses' | 'meals'>('expenses');

  const loading = expLoading || mealLoading;

  // ── Expense analytics ──────────────────────────────────────────────────────
  const thisMonth = currentMonthKey();
  const currentSummary  = useMemo(() => monthlySummaries.find((s) => `${s.year}-${String(s.month).padStart(2,'0')}` === thisMonth), [monthlySummaries, thisMonth]);
  const previousSummary = useMemo(() => monthlySummaries[1] ?? null, [monthlySummaries]);

  const expChange = useMemo(() => {
    if (!currentSummary || !previousSummary) return null;
    return percentChange(previousSummary.total, currentSummary.total);
  }, [currentSummary, previousSummary]);

  // ── Meal analytics ─────────────────────────────────────────────────────────
  const typeCount = useMemo(() => {
    const map: Record<MealType, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
    for (const m of meals) map[m.meal_type] = (map[m.meal_type] ?? 0) + 1;
    return map;
  }, [meals]);

  // Last 7 days meal count
  const last7 = useMemo(() => {
    const days: { label: string; key: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      days.push({ label: d.toLocaleDateString('en-IN',{weekday:'short'}), key, count: 0 });
    }
    for (const m of meals) {
      const day = days.find((d) => d.key === m.meal_date);
      if (day) day.count++;
    }
    return days;
  }, [meals]);

  // Month-to-month expense bars (last 6 months)
  const last6Months = useMemo(() => monthlySummaries.slice(0, 6).reverse(), [monthlySummaries]);
  const maxMonthly  = useMemo(() => Math.max(...last6Months.map((s) => s.total), 1), [last6Months]);

  // ── Meals this month ───────────────────────────────────────────────────────
  const mealsThisMonth = useMemo(() => {
    const [y, m] = thisMonth.split('-').map(Number);
    return meals.filter((meal) => {
      const [my, mm] = meal.meal_date.split('-').map(Number);
      return my === y && mm === m;
    });
  }, [meals, thisMonth]);

  const mealsThisMonthAmount = mealsThisMonth.length * 50;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading insights…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Insights" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {expError && <Alert message={expError} />}

        {/* ── Overview cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl gradient-meal text-white p-4 shadow-md">
            <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">Meal Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.outstanding_balance)}</p>
            <p className="text-blue-200 text-xs mt-1">{summary.total_meals} meals total</p>
          </div>
          <div className="rounded-2xl gradient-expense text-white p-4 shadow-md">
            <p className="text-green-100 text-xs font-medium uppercase tracking-wider mb-1">
              {formatMonthLabel(thisMonth)} Spend
            </p>
            <p className="text-2xl font-bold">{formatCurrency(currentSummary?.total ?? 0)}</p>
            {expChange !== null ? (
              <p className={`text-xs mt-1 ${expChange > 0 ? 'text-red-200' : 'text-green-200'}`}>
                {expChange > 0 ? '↑' : '↓'} {Math.abs(expChange)}% vs last month
              </p>
            ) : (
              <p className="text-green-200 text-xs mt-1">First month tracked</p>
            )}
          </div>
        </div>

        {/* ── This month meals ───────────────────────────────────────────── */}
        <Card>
          <p className="text-sm font-semibold text-gray-900 mb-3">
            Meals — {formatMonthLabel(thisMonth)}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Meals" value={String(mealsThisMonth.length)} />
            <StatBox label="Amount" value={formatCurrency(mealsThisMonthAmount)} />
            <StatBox label="Payments" value={formatCurrency(payments.filter(p => p.payment_date.startsWith(thisMonth)).reduce((s,p) => s+p.amount, 0))} />
          </div>
        </Card>

        {/* ── Month-to-month comparison toggle ───────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">Monthly Comparison</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(['expenses','meals'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setCompareMode(mode)}
                  className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    compareMode === mode
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {compareMode === 'expenses' ? (
            last6Months.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No expense data yet.</p>
            ) : (
              <div className="space-y-3">
                {last6Months.map((s, idx) => {
                  const pct = Math.round((s.total / maxMonthly) * 100);
                  const prev = last6Months[idx - 1];
                  const chg = prev ? percentChange(prev.total, s.total) : null;
                  return (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 font-medium">{s.label}</span>
                        <div className="flex items-center gap-2">
                          {chg !== null && (
                            <span className={`text-xs font-medium ${chg > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {chg > 0 ? '↑' : '↓'}{Math.abs(chg)}%
                            </span>
                          )}
                          <span className="text-xs font-bold text-gray-800">{formatCurrency(s.total)}</span>
                        </div>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-expense transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Meals last 7 days bar chart */
            <div>
              <p className="text-xs text-gray-400 mb-3">Last 7 days</p>
              <div className="flex items-end justify-between gap-1.5 h-28">
                {last7.map(({ label, count }) => {
                  const maxCount = Math.max(...last7.map((d) => d.count), 1);
                  const h = (count / maxCount) * 100;
                  return (
                    <div key={label} className="flex flex-col items-center flex-1 gap-1">
                      <span className="text-xs font-medium text-gray-500" style={{ minHeight: '1rem' }}>
                        {count > 0 ? count : ''}
                      </span>
                      <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: 64 }}>
                        <div
                          className="absolute bottom-0 w-full gradient-meal rounded-t-lg transition-all duration-700"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* ── Expense category breakdown for current month ────────────────── */}
        {currentSummary && currentSummary.byCategory.length > 0 && (
          <Card>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Top Categories — {currentSummary.label}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Highest: {currentSummary.topCategory}
            </p>
            <ul className="space-y-3">
              {currentSummary.byCategory.map((cat) => {
                const pct = currentSummary.total > 0
                  ? Math.round((cat.total / currentSummary.total) * 100) : 0;
                return (
                  <li key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 flex items-center gap-1.5">
                        <span>{cat.icon}</span> {cat.name}
                      </span>
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
        )}

        {/* ── Meal type distribution ─────────────────────────────────────── */}
        {summary.total_meals > 0 && (
          <Card>
            <p className="text-sm font-semibold text-gray-900 mb-3">Meal Distribution (All Time)</p>
            <ul className="space-y-3">
              {MEAL_TYPES.map((type) => {
                const count = typeCount[type as MealType] ?? 0;
                const pct = summary.total_meals > 0
                  ? Math.round((count / summary.total_meals) * 100) : 0;
                return (
                  <li key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <span>{MEAL_ICONS[type as MealType]}</span> {type}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {/* ── Month-to-month detailed table ──────────────────────────────── */}
        {monthlySummaries.length > 1 && (
          <Card>
            <p className="text-sm font-semibold text-gray-900 mb-3">Month Summary</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Month</th>
                    <th className="text-right pb-2 font-medium">Total</th>
                    <th className="text-right pb-2 font-medium">Items</th>
                    <th className="text-right pb-2 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {monthlySummaries.slice(0, 6).map((s, idx) => {
                    const prev = monthlySummaries[idx + 1];
                    const chg  = prev ? percentChange(prev.total, s.total) : null;
                    return (
                      <tr key={s.label}>
                        <td className="py-2.5 text-gray-700 font-medium">{s.label}</td>
                        <td className="py-2.5 text-right font-semibold text-gray-900">{formatCurrency(s.total)}</td>
                        <td className="py-2.5 text-right text-gray-500">{s.count}</td>
                        <td className="py-2.5 text-right">
                          {chg !== null ? (
                            <span className={`text-xs font-medium ${chg > 0 ? 'text-red-500' : chg < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {chg > 0 ? '+' : ''}{chg}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Empty state */}
        {monthlySummaries.length === 0 && summary.total_meals === 0 && (
          <Card>
            <div className="text-center py-10 space-y-2">
              <p className="text-4xl">📊</p>
              <p className="text-sm font-medium text-gray-700">No data yet</p>
              <p className="text-xs text-gray-400">Add meals and expenses to see your insights.</p>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
    </div>
  );
}
