import type { MealType, AppSettings } from '@/types';

/** Fixed meal price — change here to affect the whole app */
export const DEFAULT_SETTINGS: AppSettings = {
  meal_price: 50,
  currency: '₹',
};

export const MEAL_TYPES: MealType[] = ['Morning', 'Afternoon', 'Evening', 'Night'];

export const MEAL_ICONS: Record<MealType, string> = {
  Morning:   '☀️',
  Afternoon: '🌤️',
  Evening:   '🌆',
  Night:     '🌙',
};

export const MEAL_COLORS: Record<MealType, string> = {
  Morning:   'bg-amber-50 text-amber-700 border-amber-200',
  Afternoon: 'bg-sky-50 text-sky-700 border-sky-200',
  Evening:   'bg-orange-50 text-orange-700 border-orange-200',
  Night:     'bg-indigo-50 text-indigo-700 border-indigo-200',
};
