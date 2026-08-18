'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BalanceCard from '@/components/dashboard/BalanceCard';
import TodayMeals from '@/components/dashboard/TodayMeals';
import RecentActivity from '@/components/dashboard/RecentActivity';
import MealForm from '@/components/meals/MealForm';
import PaymentForm from '@/components/payments/PaymentForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { useBalance } from '@/hooks/useBalance';
import { deleteMeal } from '@/services/meals';
import { todayString, buildLedger } from '@/lib/utils';
import type { Meal, MealType, Payment } from '@/types';

export default function DashboardPage() {
  const { meals, payments, summary, loading, error, refresh } = useBalance();

  // Modal state
  const [mealFormOpen, setMealFormOpen]       = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [deleteMealOpen, setDeleteMealOpen]   = useState(false);

  // Selected records for edit/delete
  const [editingMeal, setEditingMeal]     = useState<Meal | null>(null);
  const [deletingMeal, setDeletingMeal]   = useState<Meal | null>(null);
  const [prefillType, setPrefillType]     = useState<MealType | undefined>();
  const [deleting, setDeleting]           = useState(false);
  const [deleteError, setDeleteError]     = useState('');

  const today    = todayString();
  const todayMeals = useMemo(
    () => meals.filter((m) => m.meal_date === today),
    [meals, today],
  );
  const ledger   = useMemo(() => buildLedger(meals, payments), [meals, payments]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleAddMeal = useCallback((mealType: MealType) => {
    setPrefillType(mealType);
    setEditingMeal(null);
    setMealFormOpen(true);
  }, []);

  const handleEditMeal = useCallback((meal: Meal) => {
    setEditingMeal(meal);
    setPrefillType(undefined);
    setMealFormOpen(true);
  }, []);

  const handleDeleteMealClick = useCallback((meal: Meal) => {
    setDeletingMeal(meal);
    setDeleteError('');
    setDeleteMealOpen(true);
  }, []);

  const handleConfirmDeleteMeal = useCallback(async () => {
    if (!deletingMeal) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMeal(deletingMeal.id);
      setDeleteMealOpen(false);
      setDeletingMeal(null);
      await refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }, [deletingMeal, refresh]);

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading dashboard…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">
        {error && <Alert message={error} />}

        <BalanceCard summary={summary} />

        <TodayMeals
          todayMeals={todayMeals}
          onAdd={handleAddMeal}
          onEdit={handleEditMeal}
          onDelete={handleDeleteMealClick}
        />

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            fullWidth
            onClick={() => { setPrefillType(undefined); setEditingMeal(null); setMealFormOpen(true); }}
          >
            🍽️ Add Meal
          </Button>
          <Button
            size="lg"
            fullWidth
            variant={summary.outstanding_balance <= 0 ? 'secondary' : 'secondary'}
            onClick={() => setPaymentFormOpen(true)}
            disabled={summary.outstanding_balance <= 0}
          >
            💰 Record Payment
          </Button>
        </div>

        {summary.outstanding_balance <= 0 && summary.total_meals > 0 && (
          <p className="text-center text-xs text-green-600 font-medium bg-green-50 rounded-xl py-2 px-3">
            ✓ No outstanding balance
          </p>
        )}

        {meals.length === 0 && (
          <div className="text-center py-10 space-y-3">
            <p className="text-4xl">🍽️</p>
            <p className="text-gray-500 text-sm">Your meal history is empty.</p>
            <Button onClick={() => setMealFormOpen(true)}>
              + Add Your First Meal
            </Button>
          </div>
        )}

        <RecentActivity entries={ledger} />
      </main>

      {/* Meal form modal */}
      <MealForm
        open={mealFormOpen}
        onClose={() => setMealFormOpen(false)}
        onSuccess={refresh}
        initialMealType={prefillType}
        editMeal={editingMeal}
      />

      {/* Payment form modal */}
      <PaymentForm
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        onSuccess={refresh}
        outstandingBalance={summary.outstanding_balance}
      />

      {/* Delete meal confirm */}
      <ConfirmDialog
        open={deleteMealOpen}
        onClose={() => setDeleteMealOpen(false)}
        onConfirm={handleConfirmDeleteMeal}
        title="Delete meal?"
        message={`Delete this ${deletingMeal?.meal_type} meal record for ${deletingMeal?.meal_date}? This will reduce your total meal amount by ₹50.`}
        loading={deleting}
      />
      {deleteError && <Alert message={deleteError} className="fixed bottom-24 left-4 right-4 z-50" />}
    </>
  );
}
