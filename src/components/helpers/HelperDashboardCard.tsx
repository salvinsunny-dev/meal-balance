'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getMyHelperAccess, getOwnerName } from '@/services/helpers';
import type { HelperInvitation } from '@/types';

interface OwnerAccess extends HelperInvitation {
  ownerName: string;
}

/**
 * Shown on the dashboard when the logged-in user is a helper for someone.
 * Gives a one-tap shortcut to /helper-meal.
 */
export default function HelperDashboardCard() {
  const [accessList, setAccessList] = useState<OwnerAccess[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await getMyHelperAccess();
      if (raw.length === 0) { setLoaded(true); return; }
      const enriched = await Promise.all(
        raw.map(async (inv) => ({
          ...inv,
          ownerName: await getOwnerName(inv.owner_id, inv.invitee_email),
        })),
      );
      setAccessList(enriched);
    } catch {
      // silently skip — don't block dashboard render
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Don't render anything until loaded or if not a helper for anyone
  if (!loaded || accessList.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">
        You are a helper for
      </p>
      {accessList.map((acc) => (
        <Link key={acc.id} href="/helper-meal">
          <div className="flex items-center gap-3 bg-white border border-indigo-100 rounded-2xl px-4 py-3 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all active:scale-98">
            {/* Avatar */}
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm">
              {acc.ownerName?.[0]?.toUpperCase() ?? '?'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{acc.ownerName}</p>
              <p className="text-xs text-gray-400">Tap to add a meal for them</p>
            </div>

            {/* Arrow + badge */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                + Add Meal
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
