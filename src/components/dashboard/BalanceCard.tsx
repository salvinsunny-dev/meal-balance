import React from 'react';
import type { BalanceSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';

interface BalanceCardProps {
  summary: BalanceSummary;
  userName?: string;
}

export default function BalanceCard({ summary, userName }: BalanceCardProps) {
  const { currency } = DEFAULT_SETTINGS;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative rounded-3xl overflow-hidden gradient-brand text-white shadow-xl p-6">
      {/* Decorative circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-white/5" />

      <div className="relative z-10">
        <p className="text-indigo-200 text-sm font-medium mb-0.5">
          {greeting}{userName ? `, ${userName}` : ''}
        </p>
        <p className="text-indigo-300 text-xs mb-5">Meal outstanding balance</p>

        <p className="text-5xl font-black tracking-tight mb-1 animate-count">
          {formatCurrency(summary.outstanding_balance, currency)}
        </p>
        <p className="text-indigo-300 text-xs mb-6">
          {summary.outstanding_balance <= 0 ? '✓ All clear!' : 'to be paid'}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Meals',    value: String(summary.total_meals) },
            { label: 'Charged', value: formatCurrency(summary.total_meal_amount, currency) },
            { label: 'Paid',    value: formatCurrency(summary.total_payments, currency) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-2xl px-3 py-2.5 backdrop-blur-sm">
              <p className="text-indigo-300 text-xs font-medium">{label}</p>
              <p className="text-white font-bold text-sm mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
