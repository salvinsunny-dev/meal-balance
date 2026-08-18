import type { LedgerEntry, Meal, Payment } from '@/types';

/** Format a number as Indian currency string, e.g. ₹1,050 */
export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

/** Returns today's date string in YYYY-MM-DD (local time) */
export function todayString(): string {
  const now = new Date();
  return dateToString(now);
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
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format 'YYYY-MM-DD' to 'D MMMM' (no year) */
export function formatDateShort(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
  });
}

/** Format 'HH:MM' to '8:05 AM' */
export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Returns start of week (Monday) for a given date as YYYY-MM-DD */
export function startOfWeek(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const day = date.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return dateToString(date);
}

/** Returns first day of current month as YYYY-MM-DD */
export function startOfMonth(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Merge meals and payments into a single sorted ledger (newest first) */
export function buildLedger(meals: Meal[], payments: Payment[]): LedgerEntry[] {
  const entries: LedgerEntry[] = [
    ...meals.map(
      (m): LedgerEntry => ({
        id: m.id,
        type: 'meal',
        date: m.meal_date,
        time: m.meal_time,
        label: `${m.meal_type} Meal`,
        amount: m.amount,
        created_at: m.created_at,
      }),
    ),
    ...payments.map(
      (p): LedgerEntry => ({
        id: p.id,
        type: 'payment',
        date: p.payment_date,
        time: p.payment_time,
        label: 'Payment',
        amount: -p.amount,
        note: p.note,
        created_at: p.created_at,
      }),
    ),
  ];

  // Sort by date desc, then time desc
  entries.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.time.localeCompare(a.time);
  });

  return entries;
}

/** Calculates balance summary from raw arrays */
export function calculateBalance(meals: Meal[], payments: Payment[]) {
  const totalMealAmount = meals.reduce((sum, m) => sum + m.amount, 0);
  const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);
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
    const key = entry.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

/** CSS class helper (simple classnames replacement) */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
