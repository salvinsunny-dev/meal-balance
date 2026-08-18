'use client';

import React from 'react';
import { MEAL_TYPES, MEAL_ICONS, DEFAULT_SETTINGS } from '@/lib/constants';
import { formatCurrency, formatDateShort, todayString } from '@/lib/utils';
import type { Meal, MealType } from '@/types';
import Card from '@/components/ui/Card';

interface TodayMealsProps {
  todayMeals: Meal[];
  onAdd: (mealType: MealType) => void;
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
}

export default function TodayMeals({
  todayMeals,
  onAdd,
  onEdit,
  onDelete,
}: TodayMealsProps) {
  const today = todayString();
  const recordedTypes = new Set(todayMeals.map((m) => m.meal_type));
  const { currency, meal_price } = DEFAULT_SETTINGS;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Today&apos;s Meals</h2>
          <p className="text-xs text-gray-400">{formatDateShort(today).toUpperCase()}</p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
          {todayMeals.length}/4
        </span>
      </div>

      <ul className="space-y-2">
        {MEAL_TYPES.map((type) => {
          const meal = todayMeals.find((m) => m.meal_type === type);
          const recorded = recordedTypes.has(type);

          return (
            <li
              key={type}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">{MEAL_ICONS[type]}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{type}</p>
                  {meal && (
                    <p className="text-xs text-gray-400">{meal.meal_time}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {recorded && meal ? (
                  <>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(meal.amount, currency)}
                    </span>
                    <button
                      onClick={() => onEdit(meal)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                      aria-label={`Edit ${type} meal`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(meal)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${type} meal`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onAdd(type)}
                    className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 py-1.5"
                    aria-label={`Add ${type} meal`}
                  >
                    <span className="text-base leading-none">+</span>
                    <span>{formatCurrency(meal_price, currency)}</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
