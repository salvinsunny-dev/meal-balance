import type { Expense, ExpenseCategory, ExpenseWithCategory, LedgerEntry, Meal, MonthlyExpenseSummary, Payment } from '@/types';
import { MONTHS } from '@/lib/constants';

/** Format a number as Indian currency string, e.g. ₹1,050 */
export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

/** Returns today's date string in YYYY-MM-DD (local time) */
export function todayString(): string {
  return dateToString(new Date());
}

/** Converts a Date to YYYY-MM-DD string in local time */
export function dateToString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Converts a Date to HH:MM string in local time */
export function timeToString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

/** Parse 'YYYY-MM-DD' into a Date at midnight local time */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format 'YYYY-MM-DD' to 'D MMM YYYY' */
export function formatDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

/** Format 'YYYY-MM-DD' to 'D MMMM' (no year) */
export function formatDateShort(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long',
  });
}

/** Format 'HH:MM' to '8:05 AM' */
export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** 'YYYY-MM' label → 'August 2026' */
export function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Current month as 'YYYY-MM' */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Returns start of week (Monday) for a given date as YYYY-MM-DD */
export function startOfWeek(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return dateToString(date);
}

/** Returns first day of current month as YYYY-MM-DD */
export function startOfMonth(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Returns last day of current month as YYYY-MM-DD */
export function endOfMonth(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return dateToString(last);
}

/** Merge meals and payments into a single sorted ledger (newest first) */
export function buildLedger(meals: Meal[], payments: Payment[]): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    ...meals.map((m): LedgerEntry => ({
      id: m.id,
      type: 'meal',
      date: m.meal_date,
      time: m.meal_time,
      label: `${m.meal_type} Meal`,
      amount: m.amount,
      added_by: m.added_by,
      created_at: m.created_at,
    })),
    ...payments.map((p): LedgerEntry => ({
      id: p.id,
      type: 'payment',
      date: p.payment_date,
      time: p.payment_time,
      label: 'Payment',
      amount: -p.amount,
      note: p.note,
      created_at: p.created_at,
    })),
  ];

  entries.sort((a, b) => {
    const dc = b.date.localeCompare(a.date);
    return dc !== 0 ? dc : b.time.localeCompare(a.time);
  });
  return entries;
}

/** Calculates balance summary from raw arrays */
export function calculateBalance(meals: Meal[], payments: Payment[]) {
  const totalMealAmount    = meals.reduce((s, m) => s + m.amount, 0);
  const totalPaymentAmount = payments.reduce((s, p) => s + p.amount, 0);
  return {
    total_meals: meals.length,
    total_meal_amount: totalMealAmount,
    total_payments: totalPaymentAmount,
    outstanding_balance: totalMealAmount - totalPaymentAmount,
  };
}

/** Groups ledger entries by date for display */
export function groupByDate(entries: LedgerEntry[]): Map<string, LedgerEntry[]> {
  const map = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    if (!map.has(entry.date)) map.set(entry.date, []);
    map.get(entry.date)!.push(entry);
  }
  return map;
}

// ── Expense helpers ───────────────────────────────────────────────────────────

/** Build monthly expense summaries from raw expense + category data */
export function buildMonthlySummaries(
  expenses: ExpenseWithCategory[],
): MonthlyExpenseSummary[] {
  const byMonth = new Map<string, ExpenseWithCategory[]>();

  for (const e of expenses) {
    const key = e.expense_date.slice(0, 7); // 'YYYY-MM'
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, exps]) => {
      const [y, m] = key.split('-').map(Number);
      const total = exps.reduce((s, e) => s + e.amount, 0);

      // By category
      const catMap = new Map<string, { cat: ExpenseCategory; total: number }>();
      for (const e of exps) {
        const prev = catMap.get(e.category_id) ?? { cat: e.category, total: 0 };
        catMap.set(e.category_id, { cat: e.category, total: prev.total + e.amount });
      }
      const byCategory = Array.from(catMap.values())
        .sort((a, b) => b.total - a.total)
        .map(({ cat, total: t }) => ({
          name: cat.name, icon: cat.icon, color: cat.color, total: t,
        }));

      return {
        year: y,
        month: m,
        label: `${MONTHS[m - 1]} ${y}`,
        total,
        count: exps.length,
        average: exps.length > 0 ? Math.round(total / exps.length) : 0,
        topCategory: byCategory[0]?.name ?? '—',
        byCategory,
      };
    });
}

/** Percentage change from prev to curr (returns null if prev is 0) */
export function percentChange(prev: number, curr: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

/** CSS class helper */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
