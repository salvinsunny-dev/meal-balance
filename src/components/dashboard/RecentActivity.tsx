import React from 'react';
import Link from 'next/link';
import type { LedgerEntry } from '@/types';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import Card from '@/components/ui/Card';

interface RecentActivityProps {
  entries: LedgerEntry[];
}

export default function RecentActivity({ entries }: RecentActivityProps) {
  const recent = entries.slice(0, 5);
  const { currency } = DEFAULT_SETTINGS;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
        <Link
          href="/history"
          className="text-xs text-indigo-600 font-medium hover:underline"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {recent.map((entry) => (
            <li key={`${entry.type}-${entry.id}`} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">
                  {entry.type === 'meal' ? '🍽️' : '💰'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{entry.label}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(entry.date)} · {formatTime(entry.time)}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ${
                  entry.amount > 0 ? 'text-gray-800' : 'text-green-600'
                }`}
              >
                {entry.amount > 0
                  ? `+${formatCurrency(entry.amount, currency)}`
                  : `−${formatCurrency(Math.abs(entry.amount), currency)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
