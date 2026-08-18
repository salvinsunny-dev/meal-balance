'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { MEAL_TYPES, MEAL_ICONS, DEFAULT_SETTINGS } from '@/lib/constants';
import { todayString, timeToString, formatCurrency } from '@/lib/utils';
import { addMeal, updateMeal } from '@/services/meals';
import type { Meal, MealType, MealFormData } from '@/types';

interface MealFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMealType?: MealType;
  editMeal?: Meal | null;
}

export default function MealForm({
  open,
  onClose,
  onSuccess,
  initialMealType,
  editMeal,
}: MealFormProps) {
  const isEdit = !!editMeal;

  const [mealType, setMealType] = useState<MealType>(
    editMeal?.meal_type ?? initialMealType ?? 'Morning',
  );
  const [mealDate, setMealDate] = useState(editMeal?.meal_date ?? todayString());
  const [mealTime, setMealTime] = useState(
    editMeal?.meal_time ?? timeToString(new Date()),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Reset when modal opens with new props
  useEffect(() => {
    if (open) {
      setMealType(editMeal?.meal_type ?? initialMealType ?? 'Morning');
      setMealDate(editMeal?.meal_date ?? todayString());
      setMealTime(editMeal?.meal_time ?? timeToString(new Date()));
      setError('');
    }
  }, [open, editMeal, initialMealType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData: MealFormData = { meal_type: mealType, meal_date: mealDate, meal_time: mealTime };

    try {
      if (isEdit && editMeal) {
        await updateMeal(editMeal.id, formData);
      } else {
        await addMeal(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Meal' : 'Add Meal'}
    >
      {error && <Alert message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Meal type selector */}
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

        {/* Fixed price display */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
          <span className="text-sm text-gray-600">Amount</span>
          <span className="text-lg font-bold text-gray-900">
            {formatCurrency(DEFAULT_SETTINGS.meal_price, DEFAULT_SETTINGS.currency)}
          </span>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={loading}>
            {isEdit ? 'Save changes' : 'Add meal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
