'use client';
export const dynamic = 'force-dynamic';

import React, { useMemo } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { useBalance } from '@/hooks/useBalance';
import { formatCurrency, todayString, startOfMonth } from '@/lib/utils';
import { MEAL_TYPES, MEAL_ICONS, DEFAULT_SETTINGS } from '@/lib/constants';
import type { MealType } from '@/types';

export default function StatisticsPage() {
  const { meals, payments, summary, loading, error } = useBalance();
  const { currency } = DEFAULT_SETTINGS;
  const today = todayString();
  const monthStart = startOfMonth(today);

  const stats = useMemo(() => {
    const thisMonthMeals    = meals.filter((m) => m.meal_date >= monthStart);
    const thisMonthPayments = payments.filter((p) => p.payment_date >= monthStart);

    // Meal type distribution (all time)
    const typeCount: Record<MealType, number> = {
      Morning: 0, Afternoon: 0, Evening: 0, Night: 0,
    };
    for (const m of meals) {
      typeCount[m.meal_type] = (typeCount[m.meal_type] ?? 0) + 1;
    }

    // Last 7 days meal count per day
    const last7: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      last7[key] = 0;
    }
    for (const m of meals) {
      if (m.meal_date in last7) last7[m.meal_date]++;
    }

    return {
      thisMonthMeals:      thisMonthMeals.length,
      thisMonthAmount:     thisMonthMeals.reduce((s, m) => s + m.amount, 0),
      thisMonthPayments:   thisMonthPayments.reduce((s, p) => s + p.amount, 0),
      typeCount,
      last7,
    };
  }, [meals, payments, monthStart]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading statistics…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Statistics" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {error && <Alert message={error} />}

        {/* Overall summary */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Overall</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Total Meals"        value={String(summary.total_meals)} />
            <StatBox label="Total Meal Amount"  value={formatCurrency(summary.total_meal_amount, currency)} />
            <StatBox label="Total Payments"     value={formatCurrency(summary.total_payments, currency)} />
            <StatBox label="Current Balance"    value={formatCurrency(summary.outstanding_balance, currency)} accent />
          </div>
        </Card>

        {/* This month */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">This Month</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Meals"    value={String(stats.thisMonthMeals)} />
            <StatBox label="Spent"    value={formatCurrency(stats.thisMonthAmount, currency)} />
            <StatBox label="Payments" value={formatCurrency(stats.thisMonthPayments, currency)} />
            <StatBox
              label="Balance Added"
              value={formatCurrency(stats.thisMonthAmount - stats.thisMonthPayments, currency)}
            />
          </div>
        </Card>

        {/* Meal type distribution */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Meal Type Distribution
          </h2>
          {summary.total_meals === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No meals recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {MEAL_TYPES.map((type) => {
                const count = stats.typeCount[type] ?? 0;
                const pct   = summary.total_meals > 0
                  ? Math.round((count / summary.total_meals) * 100)
                  : 0;
                return (
                  <li key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <span>{MEAL_ICONS[type]}</span> {type}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Last 7 days */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Last 7 Days</h2>
          <div className="flex items-end justify-between gap-1 h-24">
            {Object.entries(stats.last7).map(([date, count]) => {
              const dayLabel = new Date(date + 'T00:00').toLocaleDateString('en-IN', {
                weekday: 'short',
              });
              const maxCount = Math.max(...Object.values(stats.last7), 1);
              const heightPct = (count / maxCount) * 100;
              return (
                <div key={date} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-xs font-medium text-gray-600">{count > 0 ? count : ''}</span>
                  <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '60px' }}>
                    <div
                      className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Average meals/day */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Averages</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              label="Avg meals/day"
              value={
                summary.total_meals > 0
                  ? (summary.total_meals / Math.max(
                      Object.keys(
                        meals.reduce((acc, m) => ({ ...acc, [m.meal_date]: true }), {} as Record<string, boolean>)
                      ).length, 1
                    )).toFixed(1)
                  : '0'
              }
            />
            <StatBox
              label="Avg daily spend"
              value={
                summary.total_meals > 0
                  ? formatCurrency(
                      Math.round(
                        summary.total_meal_amount /
                          Math.max(
                            Object.keys(
                              meals.reduce((acc, m) => ({ ...acc, [m.meal_date]: true }), {} as Record<string, boolean>)
                            ).length, 1
                          ),
                      ),
                      currency,
                    )
                  : formatCurrency(0, currency)
              }
            />
          </div>
        </Card>
      </main>
    </>
  );
}

function StatBox({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        accent ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-gray-100'
      }`}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-base font-bold ${accent ? 'text-indigo-700' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  );
}
