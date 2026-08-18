import React from 'react';
import type { BalanceSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import Card from '@/components/ui/Card';

interface BalanceCardProps {
  summary: BalanceSummary;
}

export default function BalanceCard({ summary }: BalanceCardProps) {
  const { currency } = DEFAULT_SETTINGS;

  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-purple-600 border-0 text-white" padding="lg">
      <p className="text-indigo-200 text-sm font-medium uppercase tracking-widest mb-1">
        Outstanding Balance
      </p>
      <p className="text-5xl font-bold tracking-tight mb-6">
        {formatCurrency(summary.outstanding_balance, currency)}
      </p>

      <div className="grid grid-cols-3 gap-2">
        <StatItem
          label="Meals"
          value={String(summary.total_meals)}
          sublabel={`${formatCurrency(summary.total_meal_amount, currency)}`}
        />
        <StatItem
          label="Paid"
          value={formatCurrency(summary.total_payments, currency)}
          sublabel="total payments"
        />
        <StatItem
          label="Balance"
          value={formatCurrency(summary.outstanding_balance, currency)}
          sublabel="to be paid"
        />
      </div>
    </Card>
  );
}

function StatItem({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <p className="text-indigo-200 text-xs font-medium">{label}</p>
      <p className="text-white font-bold text-sm mt-0.5 truncate">{value}</p>
      <p className="text-indigo-200 text-xs truncate">{sublabel}</p>
    </div>
  );
}
