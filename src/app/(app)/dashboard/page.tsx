'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BalanceCard from '@/components/dashboard/BalanceCard';
import TodayMeals from '@/components/dashboard/TodayMeals';
import RecentActivity from '@/components/dashboard/RecentActivity';
import PendingInvitations from '@/components/helpers/PendingInvitations';
import MealForm from '@/components/meals/MealForm';
import PaymentForm from '@/components/payments/PaymentForm';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import { useBalance } from '@/hooks/useBalance';
import { deleteMeal } from '@/services/meals';
import { getProfile } from '@/services/profile';
import { todayString, buildLedger, currentMonthKey, formatMonthLabel } from '@/lib/utils';
import type { Meal, MealType } from '@/types';
import Link from 'next/link';
import HelperDashboardCard from '@/components/helpers/HelperDashboardCard';

export default function DashboardPage() {
  const { meals, payments, summary, loading, error, refresh } = useBalance();
  const [userName, setUserName] = useState('');

  // Modal state
  const [mealFormOpen, setMealFormOpen]       = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [deleteMealOpen, setDeleteMealOpen]   = useState(false);
  const [editingMeal, setEditingMeal]         = useState<Meal | null>(null);
  const [deletingMeal, setDeletingMeal]       = useState<Meal | null>(null);
  const [prefillType, setPrefillType]         = useState<MealType | undefined>();
  const [deleting, setDeleting]               = useState(false);
  const [deleteError, setDeleteError]         = useState('');

  // Load display name
  useEffect(() => {
    getProfile().then((p) => { if (p?.display_name) setUserName(p.display_name); }).catch(() => {});
  }, []);

  const today      = todayString();
  const todayMeals = useMemo(() => meals.filter((m) => m.meal_date === today), [meals, today]);
  const ledger     = useMemo(() => buildLedger(meals, payments), [meals, payments]);

  // This month expenses quick stat (just meal amount)
  const thisMonth      = currentMonthKey();
  const mealsThisMonth = useMemo(() => meals.filter((m) => m.meal_date.startsWith(thisMonth)), [meals, thisMonth]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner label="Loading…" />
      </div>
    );
  }

  return (
    <>
      <AppHeader />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-4 space-y-4">
        {error && <Alert message={error} />}

        {/* Pending invitations banner */}
        <PendingInvitations />

        {/* Helper shortcut — shown only when this user helps someone else */}
        <HelperDashboardCard />

        {/* Hero balance card */}
        <BalanceCard summary={summary} userName={userName} />

        {/* Quick stat pills */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/expenses" className="group">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-emerald-200 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-lg shrink-0">💸</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">This month</p>
                <p className="text-sm font-bold text-gray-800 truncate">Expenses</p>
              </div>
              <svg className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 ml-auto shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>

          <Link href="/insights" className="group">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-indigo-200 hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-lg shrink-0">📊</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">{mealsThisMonth.length} meals</p>
                <p className="text-sm font-bold text-gray-800 truncate">{formatMonthLabel(thisMonth).split(' ')[0]}</p>
              </div>
              <svg className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 ml-auto shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        </div>

        {/* Today's meals */}
        <TodayMeals
          todayMeals={todayMeals}
          onAdd={handleAddMeal}
          onEdit={handleEditMeal}
          onDelete={handleDeleteMealClick}
        />

        {/* Primary action row */}
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
            variant="secondary"
            onClick={() => setPaymentFormOpen(true)}
            disabled={summary.outstanding_balance <= 0}
          >
            💸 Pay
          </Button>
        </div>

        {/* Zero balance badge */}
        {summary.outstanding_balance <= 0 && summary.total_meals > 0 && (
          <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl py-3 px-4">
            <span className="text-emerald-500 text-lg">🎉</span>
            <p className="text-sm font-semibold text-emerald-700">No outstanding balance</p>
          </div>
        )}

        {/* Empty state */}
        {meals.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 text-center py-12 space-y-3">
            <p className="text-5xl">🍽️</p>
            <p className="text-base font-semibold text-gray-700">Start tracking your meals</p>
            <p className="text-sm text-gray-400">Each meal is ₹50. Tap below to begin.</p>
            <Button onClick={() => setMealFormOpen(true)} className="mt-2">
              + Add Your First Meal
            </Button>
          </div>
        )}

        {/* Recent activity */}
        <RecentActivity entries={ledger} />
      </main>

      {/* Modals */}
      <MealForm
        open={mealFormOpen}
        onClose={() => setMealFormOpen(false)}
        onSuccess={refresh}
        initialMealType={prefillType}
        editMeal={editingMeal}
      />

      <PaymentForm
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        onSuccess={refresh}
        outstandingBalance={summary.outstanding_balance}
      />

      <ConfirmDialog
        open={deleteMealOpen}
        onClose={() => setDeleteMealOpen(false)}
        onConfirm={handleConfirmDeleteMeal}
        title="Delete this meal?"
        message={`Remove the ${deletingMeal?.meal_type} meal on ${deletingMeal?.meal_date}? Your balance will decrease by ₹50.`}
        loading={deleting}
      />
      {deleteError && (
        <Alert message={deleteError} className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto" />
      )}
    </>
  );
}
