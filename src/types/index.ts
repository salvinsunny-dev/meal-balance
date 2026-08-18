// ─── Application-wide TypeScript types ────────────────────────────────────────

export type MealType = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  user_id: string;
  meal_type: MealType;
  meal_date: string;   // 'YYYY-MM-DD'
  meal_time: string;   // 'HH:MM'
  amount: number;      // always 50
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string; // 'YYYY-MM-DD'
  payment_time: string; // 'HH:MM'
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BalanceSummary {
  total_meals: number;
  total_meal_amount: number;
  total_payments: number;
  outstanding_balance: number;
}

/** Combined ledger entry for the history page */
export interface LedgerEntry {
  id: string;
  type: 'meal' | 'payment';
  date: string;
  time: string;
  label: string;         // e.g. "Morning Meal" or "Payment"
  amount: number;        // positive for meals, negative for payments
  note?: string | null;
  created_at: string;
}

export type FilterPeriod = 'today' | 'week' | 'month' | 'custom' | 'all';
export type FilterType   = 'all' | 'meals' | 'payments';

export interface AppSettings {
  meal_price: number;   // default 50
  currency: string;     // default '₹'
}

// ─── Form-level input types ───────────────────────────────────────────────────

export interface MealFormData {
  meal_type: MealType;
  meal_date: string;
  meal_time: string;
}

export interface PaymentFormData {
  amount: number;
  payment_date: string;
  payment_time: string;
  note: string;
}
