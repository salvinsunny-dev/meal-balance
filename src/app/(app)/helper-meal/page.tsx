'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getMyHelperAccess, getOwnerName } from '@/services/helpers';
import { addMeal } from '@/services/meals';
import { MEAL_TYPES, MEAL_ICONS, DEFAULT_SETTINGS } from '@/lib/constants';
import { todayString, timeToString, formatCurrency } from '@/lib/utils';
import type { HelperInvitation, MealType } from '@/types';

interface OwnerAccess extends HelperInvitation {
  ownerName: string;
}

export default function HelperMealPage() {
  const [accessList, setAccessList]       = useState<OwnerAccess[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedOwner, setSelectedOwner] = useState<OwnerAccess | null>(null);
  const [mealType, setMealType]           = useState<MealType>('Morning');
  const [mealDate, setMealDate]           = useState(todayString());
  const [mealTime, setMealTime]           = useState(timeToString(new Date()));
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getMyHelperAccess();
      const enriched = await Promise.all(
        raw.map(async (inv) => ({ ...inv, ownerName: await getOwnerName(inv.owner_id) })),
      );
      setAccessList(enriched);
      if (enriched.length === 1) setSelectedOwner(enriched[0]);
    } catch {
      setError('Failed to load helper access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOwner) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await addMeal(
        { meal_type: mealType, meal_date: mealDate, meal_time: mealTime },
        selectedOwner.owner_id,
      );
      setSuccess(`${mealType} meal added for ${selectedOwner.ownerName}!`);
      // Reset time for next entry
      setMealTime(timeToString(new Date()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading access…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader title="Add Meal for Owner" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {accessList.length === 0 ? (
          <Card>
            <div className="text-center py-8 space-y-2">
              <p className="text-3xl">🔒</p>
              <p className="text-sm font-medium text-gray-700">No helper access</p>
              <p className="text-xs text-gray-400">
                You haven&apos;t been granted access to add meals for anyone yet. Ask the owner to invite you.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Owner selector */}
            {accessList.length > 1 && (
              <Card>
                <p className="text-sm font-medium text-gray-700 mb-2">Add meal for:</p>
                <div className="space-y-2">
                  {accessList.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => { setSelectedOwner(acc); setError(''); setSuccess(''); }}
                      className={`w-full text-left flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-colors ${
                        selectedOwner?.id === acc.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">👤</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{acc.ownerName}</p>
                        <p className="text-xs text-gray-400">{acc.invitee_email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {selectedOwner && (
              <Card>
                {/* Owner banner */}
                <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3 mb-4">
                  <span className="text-2xl">👤</span>
                  <div>
                    <p className="text-xs text-indigo-500 font-medium">Adding meal for</p>
                    <p className="text-sm font-bold text-indigo-800">{selectedOwner.ownerName}</p>
                  </div>
                </div>

                {error   && <Alert variant="error"   message={error}   className="mb-4" />}
                {success && <Alert variant="success" message={success} className="mb-4" />}

                <form onSubmit={handleAddMeal} className="space-y-4">
                  {/* Meal type grid */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Meal Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      {MEAL_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setMealType(type)}
                          className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                            mealType === type
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span>{MEAL_ICONS[type]}</span>
                          {type}
                        </button>
                      ))}
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

                  <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(DEFAULT_SETTINGS.meal_price, DEFAULT_SETTINGS.currency)}
                    </span>
                  </div>

                  <Button type="submit" fullWidth size="lg" loading={saving}>
                    Add Meal for {selectedOwner.ownerName}
                  </Button>
                </form>
              </Card>
            )}
          </>
        )}
      </main>
    </>
  );
}
