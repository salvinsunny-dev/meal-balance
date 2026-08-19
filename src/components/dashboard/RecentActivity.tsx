import React from 'react';
import Link from 'next/link';
import type { LedgerEntry } from '@/types';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';

interface RecentActivityProps {
  entries: LedgerEntry[];
}

export default function RecentActivity({ entries }: RecentActivityProps) {
  const recent = entries.slice(0, 6);
  const { currency } = DEFAULT_SETTINGS;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
        <h2 className="text-sm font-bold text-gray-900">Recent Activity</h2>
        <Link
          href="/history"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition-colors"
        >
          View all
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">✨</p>
          <p className="text-sm text-gray-400">No activity yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {recent.map((entry) => (
            <li key={`${entry.type}-${entry.id}`} className="flex items-center gap-3 px-4 py-3">
              {/* Icon bubble */}
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                entry.type === 'meal' ? 'bg-indigo-50' : 'bg-emerald-50'
              }`}>
                {entry.type === 'meal' ? '🍽️' : '💸'}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{entry.label}</p>
                <p className="text-xs text-gray-400">
                  {formatDate(entry.date)} · {formatTime(entry.time)}
                </p>
              </div>

              <span className={`text-sm font-bold shrink-0 ${
                entry.amount > 0 ? 'text-gray-700' : 'text-emerald-600'
              }`}>
                {entry.amount > 0
                  ? `+${formatCurrency(entry.amount, currency)}`
                  : `−${formatCurrency(Math.abs(entry.amount), currency)}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
