'use client';

import React from 'react';
import { MEAL_TYPES, MEAL_ICONS, DEFAULT_SETTINGS } from '@/lib/constants';
import { formatCurrency, formatDateShort, todayString } from '@/lib/utils';
import type { Meal, MealType } from '@/types';

interface TodayMealsProps {
  todayMeals: Meal[];
  onAdd: (mealType: MealType) => void;
  onEdit: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
}

const mealGradients: Record<MealType, string> = {
  Morning:   'from-amber-400 to-orange-400',
  Afternoon: 'from-sky-400 to-blue-500',
  Evening:   'from-orange-400 to-rose-500',
  Night:     'from-indigo-500 to-purple-600',
};

/**
 * Each meal type becomes available at a specific hour (24h).
 * Before that hour the row is shown as "coming up" — greyed out, no add button.
 * After that hour the add button appears (or edit/delete if already recorded).
 */
const MEAL_AVAILABLE_FROM: Record<MealType, number> = {
  Morning:   8,   // available from 8:00 AM
  Afternoon: 12,  // available from 12:00 PM
  Evening:   17,  // available from 5:00 PM
  Night:     20,  // available from 8:00 PM
};

/** Human-readable "available from" label */
const MEAL_FROM_LABEL: Record<MealType, string> = {
  Morning:   'from 8 AM',
  Afternoon: 'from 12 PM',
  Evening:   'from 5 PM',
  Night:     'from 8 PM',
};

export default function TodayMeals({ todayMeals, onAdd, onEdit, onDelete }: TodayMealsProps) {
  const today       = todayString();
  const recordedSet = new Set(todayMeals.map((m) => m.meal_type));
  const currentHour = new Date().getHours();
  const { currency, meal_price } = DEFAULT_SETTINGS;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Today&apos;s Meals</h2>
          <p className="text-xs text-gray-400 mt-0.5">{formatDateShort(today)}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          todayMeals.length === 4
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {todayMeals.length}/4
        </span>
      </div>

      {/* Meal rows */}
      <ul className="divide-y divide-gray-50">
        {MEAL_TYPES.map((type) => {
          const meal      = todayMeals.find((m) => m.meal_type === type);
          const recorded  = recordedSet.has(type);
          const available = currentHour >= MEAL_AVAILABLE_FROM[type];

          return (
            <li
              key={type}
              className={`flex items-center gap-3 px-4 py-3 transition-opacity ${
                !available && !recorded ? 'opacity-50' : ''
              }`}
            >
              {/* Icon */}
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm ${
                available || recorded
                  ? `bg-gradient-to-br ${mealGradients[type]}`
                  : 'bg-gray-100'
              }`}>
                {MEAL_ICONS[type]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${available || recorded ? 'text-gray-800' : 'text-gray-400'}`}>
                  {type}
                </p>
                {recorded && meal ? (
                  <p className="text-xs text-gray-400">{meal.meal_time}</p>
                ) : available ? (
                  <p className="text-xs text-gray-300">Not recorded</p>
                ) : (
                  <p className="text-xs text-gray-300">Available {MEAL_FROM_LABEL[type]}</p>
                )}
              </div>

              {/* Action */}
              {recorded && meal ? (
                /* Already recorded — show amount + edit + delete */
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-sm font-bold text-emerald-600">
                    {formatCurrency(meal.amount, currency)}
                  </span>
                  <button
                    onClick={() => onEdit(meal)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    aria-label={`Edit ${type}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(meal)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    aria-label={`Delete ${type}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ) : available ? (
                /* Time has come — show add button */
                <button
                  onClick={() => onAdd(type)}
                  className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r ${mealGradients[type]} text-white shadow-sm hover:shadow-md active:scale-95 transition-all`}
                  aria-label={`Add ${type}`}
                >
                  <span>+</span>
                  <span>{formatCurrency(meal_price, currency)}</span>
                </button>
              ) : (
                /* Too early — show locked badge */
                <span className="shrink-0 text-xs text-gray-300 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-xl">
                  {MEAL_FROM_LABEL[type]}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
