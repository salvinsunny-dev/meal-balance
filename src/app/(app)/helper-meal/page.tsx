'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getMyHelperAccess, getOwnerName } from '@/services/helpers';
import { getProfile } from '@/services/profile';
import { addMeal } from '@/services/meals';
import { MEAL_TYPES, MEAL_ICONS, DEFAULT_SETTINGS } from '@/lib/constants';
import { todayString, timeToString, formatCurrency } from '@/lib/utils';
import type { HelperInvitation, MealType } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

/** An account this user can add meals for (either their own or someone else's) */
interface MealTarget {
  /** null means "my own account" */
  invitationId: string | null;
  /** user_id of the account meals will be added to */
  ownerId: string;
  /** Display name shown in the UI */
  ownerName: string;
  /** true = this is the current user's own account */
  isSelf: boolean;
}

const mealGradients: Record<MealType, string> = {
  Morning:   'from-amber-400 to-orange-400',
  Afternoon: 'from-sky-400 to-blue-500',
  Evening:   'from-orange-400 to-rose-500',
  Night:     'from-indigo-500 to-purple-600',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HelperMealPage() {
  const [targets, setTargets]           = useState<MealTarget[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<MealTarget | null>(null);

  // Form state
  const [mealType, setMealType] = useState<MealType>('Morning');
  const [mealDate, setMealDate] = useState(todayString());
  const [mealTime, setMealTime] = useState(timeToString(new Date()));
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const currentHour = new Date().getHours();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. My own account (always available)
      const profile = await getProfile();
      const selfTarget: MealTarget = {
        invitationId: null,
        ownerId:      profile?.user_id ?? '',
        ownerName:    profile?.display_name ?? 'Me',
        isSelf:       true,
      };

      // 2. Accounts I help (accepted invitations where I am the helper)
      const helperAccess = await getMyHelperAccess();
      const helperTargets: MealTarget[] = await Promise.all(
        helperAccess.map(async (inv: HelperInvitation) => ({
          invitationId: inv.id,
          ownerId:      inv.owner_id,
          ownerName:    await getOwnerName(inv.owner_id, inv.invitee_email),
          isSelf:       false,
        })),
      );

      // Combine: own account first, then friends
      const allTargets = [selfTarget, ...helperTargets];
      setTargets(allTargets);

      // Auto-select: if only self, select self; if only one friend, select that friend
      if (allTargets.length === 1) {
        setSelectedTarget(allTargets[0]);
      } else if (allTargets.length === 2) {
        // If there's exactly one friend, pre-select them (most likely intent)
        setSelectedTarget(allTargets[1]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTarget) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await addMeal(
        { meal_type: mealType, meal_date: mealDate, meal_time: mealTime },
        // Pass ownerId only if adding for someone else
        selectedTarget.isSelf ? undefined : selectedTarget.ownerId,
      );
      const whoFor = selectedTarget.isSelf ? 'your account' : selectedTarget.ownerName;
      setSuccess(`✓ ${mealType} meal added for ${whoFor}!`);
      setMealTime(timeToString(new Date()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal');
    } finally {
      setSaving(false);
    }
  }

  // Friends only (not self) — shown in the "you help" section
  const friendTargets = useMemo(() => targets.filter((t) => !t.isSelf), [targets]);
  const selfTarget    = useMemo(() => targets.find((t) => t.isSelf) ?? null, [targets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Add Meal" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {error && <Alert message={error} className="mb-2" />}

        {/* ── Account selector ─────────────────────────────────────────── */}
        <Card>
          <p className="text-sm font-bold text-gray-900 mb-3">Add meal for</p>
          <div className="space-y-2">
            {/* Own account */}
            {selfTarget && (
              <button
                type="button"
                onClick={() => { setSelectedTarget(selfTarget); setError(''); setSuccess(''); }}
                className={`w-full text-left flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 transition-all ${
                  selectedTarget?.isSelf
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-200'
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-sm">
                  {selfTarget.ownerName[0]?.toUpperCase() ?? 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{selfTarget.ownerName}</p>
                  <p className="text-xs text-gray-400">My own account</p>
                </div>
                {selectedTarget?.isSelf && (
                  <span className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            )}

            {/* Friend accounts */}
            {friendTargets.length > 0 && (
              <div className="space-y-2">
                {friendTargets.map((target) => (
                  <button
                    key={target.invitationId}
                    type="button"
                    onClick={() => { setSelectedTarget(target); setError(''); setSuccess(''); }}
                    className={`w-full text-left flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 transition-all ${
                      selectedTarget?.invitationId === target.invitationId
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-base font-bold shrink-0 shadow-sm">
                      {target.ownerName[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{target.ownerName}</p>
                      <p className="text-xs text-gray-400">Friend&apos;s account</p>
                    </div>
                    {selectedTarget?.invitationId === target.invitationId && (
                      <span className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No friends connected yet */}
            {friendTargets.length === 0 && (
              <div className="bg-gray-50 rounded-2xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400">No friends connected yet.</p>
                <p className="text-xs text-gray-400">Go to Settings → Helpers → Invite to connect.</p>
              </div>
            )}
          </div>
        </Card>

        {/* ── Meal form ────────────────────────────────────────────────── */}
        {selectedTarget && (
          <Card>
            {/* Who this meal is for */}
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-5 ${
              selectedTarget.isSelf ? 'bg-indigo-50' : 'bg-emerald-50'
            }`}>
              <span className="text-2xl">
                {selectedTarget.isSelf ? '👤' : '🤝'}
              </span>
              <div>
                <p className={`text-xs font-semibold ${selectedTarget.isSelf ? 'text-indigo-500' : 'text-emerald-600'}`}>
                  Adding meal for
                </p>
                <p className={`text-sm font-bold ${selectedTarget.isSelf ? 'text-indigo-800' : 'text-emerald-800'}`}>
                  {selectedTarget.isSelf ? 'Yourself' : selectedTarget.ownerName}
                </p>
              </div>
            </div>

            {success && <Alert variant="success" message={success} className="mb-4" />}
            {error   && <Alert variant="error"   message={error}   className="mb-4" />}

            <form onSubmit={handleAddMeal} className="space-y-4">
              {/* Meal type grid */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Meal Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TYPES.map((type) => {
                    const gradientClass = mealGradients[type];
                    const isSelected = mealType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMealType(type)}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                          isSelected
                            ? `bg-gradient-to-r ${gradientClass} text-white border-transparent shadow-sm`
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-base">{MEAL_ICONS[type]}</span>
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Date"
                type="date"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
                max={todayString()}
                required
              />

              <Input
                label="Time"
                type="time"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                required
              />

              {/* Fixed price display */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                <span className="text-sm font-medium text-gray-600">Amount</span>
                <span className="text-lg font-black text-gray-900">
                  {formatCurrency(DEFAULT_SETTINGS.meal_price, DEFAULT_SETTINGS.currency)}
                </span>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={saving}
                className={!selectedTarget.isSelf ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
              >
                {selectedTarget.isSelf
                  ? `Add ${mealType} Meal`
                  : `Add Meal for ${selectedTarget.ownerName}`}
              </Button>
            </form>
          </Card>
        )}
      </main>
    </>
  );
}
