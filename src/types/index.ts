// ─── Application-wide TypeScript types ────────────────────────────────────────

// ── Meals ─────────────────────────────────────────────────────────────────────
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
  meal_date: string;    // 'YYYY-MM-DD'
  meal_time: string;    // 'HH:MM'
  amount: number;       // always 50
  added_by: string;     // user_id of who actually added it (owner or helper)
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  payment_time: string;
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
  label: string;
  amount: number;        // positive for meals, negative for payments
  note?: string | null;
  added_by?: string;     // user_id — only on meal entries
  created_at: string;
}

export type FilterPeriod = 'today' | 'week' | 'month' | 'custom' | 'all';
export type FilterType   = 'all' | 'meals' | 'payments';

export interface AppSettings {
  meal_price: number;
  currency: string;
}

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

// ── Friends / Helpers ─────────────────────────────────────────────────────────
export type InvitationStatus = 'pending' | 'accepted' | 'revoked';

export type HelperPermission =
  | 'ADD_MEAL'
  | 'EDIT_MEAL'
  | 'DELETE_MEAL'
  | 'VIEW_MEALS'
  | 'VIEW_BALANCE'
  | 'ADD_PAYMENT';

export interface HelperInvitation {
  id: string;
  owner_id: string;
  invitee_email: string;
  helper_user_id: string | null;   // set after acceptance
  status: InvitationStatus;
  permissions: HelperPermission[];
  created_at: string;
  updated_at: string;
}

// ── Expenses ──────────────────────────────────────────────────────────────────
export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  expense_date: string; // 'YYYY-MM-DD'
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategory extends Expense {
  category: ExpenseCategory;
}

export interface MonthlyExpenseSummary {
  year: number;
  month: number;        // 1–12
  label: string;        // e.g. "August 2026"
  total: number;
  count: number;
  average: number;
  topCategory: string;
  byCategory: { name: string; icon: string; color: string; total: number }[];
}

export interface ExpenseFormData {
  category_id: string;
  amount: number;
  expense_date: string;
  note: string;
}
