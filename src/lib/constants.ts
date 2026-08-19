import type { MealType, AppSettings } from '@/types';

export const APP_NAME = 'ChoreKanakku';
export const APP_TAGLINE = 'Meals · Expenses · Balance';

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

/** Default expense categories with icon + color */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Room Rent',    icon: '🏠', color: 'bg-blue-500' },
  { name: 'Electricity',  icon: '⚡', color: 'bg-yellow-500' },
  { name: 'Water',        icon: '💧', color: 'bg-cyan-500' },
  { name: 'Internet',     icon: '📡', color: 'bg-purple-500' },
  { name: 'Groceries',    icon: '🛒', color: 'bg-green-500' },
  { name: 'Transport',    icon: '🚌', color: 'bg-orange-500' },
  { name: 'Mobile',       icon: '📱', color: 'bg-pink-500' },
  { name: 'Medical',      icon: '🏥', color: 'bg-red-500' },
  { name: 'Education',    icon: '📚', color: 'bg-indigo-500' },
  { name: 'Shopping',     icon: '🛍️', color: 'bg-fuchsia-500' },
  { name: 'Other',        icon: '📦', color: 'bg-gray-500' },
] as const;

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
