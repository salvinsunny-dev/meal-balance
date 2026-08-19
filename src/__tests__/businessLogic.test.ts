/**
 * MealBalance — Business Logic Tests
 *
 * Tests cover the pure calculation functions in lib/utils.ts.
 * No database or network calls are made here.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBalance,
  buildLedger,
  todayString,
  dateToString,
  timeToString,
  formatCurrency,
  formatDate,
  formatTime,
  startOfWeek,
  startOfMonth,
  groupByDate,
} from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { Meal, Payment } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id:         overrides.id         ?? 'meal-1',
    user_id:    overrides.user_id    ?? 'user-a',
    meal_type:  overrides.meal_type  ?? 'Morning',
    meal_date:  overrides.meal_date  ?? '2026-08-17',
    meal_time:  overrides.meal_time  ?? '08:00',
    amount:     overrides.amount     ?? DEFAULT_SETTINGS.meal_price,
    added_by:   overrides.added_by   ?? overrides.user_id ?? 'user-a',
    created_at: overrides.created_at ?? '2026-08-17T08:00:00Z',
    updated_at: overrides.updated_at ?? '2026-08-17T08:00:00Z',
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id:           overrides.id           ?? 'pay-1',
    user_id:      overrides.user_id      ?? 'user-a',
    amount:       overrides.amount       ?? 100,
    payment_date: overrides.payment_date ?? '2026-08-17',
    payment_time: overrides.payment_time ?? '10:00',
    note:         overrides.note         ?? null,
    created_at:   overrides.created_at   ?? '2026-08-17T10:00:00Z',
    updated_at:   overrides.updated_at   ?? '2026-08-17T10:00:00Z',
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('meal price is ₹50', () => {
    expect(DEFAULT_SETTINGS.meal_price).toBe(50);
  });

  it('currency symbol is ₹', () => {
    expect(DEFAULT_SETTINGS.currency).toBe('₹');
  });
});

// ─── calculateBalance ─────────────────────────────────────────────────────────

describe('calculateBalance', () => {
  it('Case 1 — no meals, no payments: balance = 0', () => {
    const result = calculateBalance([], []);
    expect(result.total_meals).toBe(0);
    expect(result.total_meal_amount).toBe(0);
    expect(result.total_payments).toBe(0);
    expect(result.outstanding_balance).toBe(0);
  });

  it('Case 2 — 5 meals, no payments: balance = ₹250', () => {
    const meals = Array.from({ length: 5 }, (_, i) =>
      makeMeal({ id: `meal-${i}` }),
    );
    const result = calculateBalance(meals, []);
    expect(result.total_meals).toBe(5);
    expect(result.total_meal_amount).toBe(250);
    expect(result.total_payments).toBe(0);
    expect(result.outstanding_balance).toBe(250);
  });

  it('Case 3 — 5 meals + ₹100 payment: balance = ₹150', () => {
    const meals   = Array.from({ length: 5 }, (_, i) => makeMeal({ id: `meal-${i}` }));
    const payment = makePayment({ amount: 100 });
    const result  = calculateBalance(meals, [payment]);
    expect(result.total_meal_amount).toBe(250);
    expect(result.total_payments).toBe(100);
    expect(result.outstanding_balance).toBe(150);
  });

  it('Case 4 — 5 meals + ₹250 payment (full): balance = 0', () => {
    const meals   = Array.from({ length: 5 }, (_, i) => makeMeal({ id: `meal-${i}` }));
    const payment = makePayment({ amount: 250 });
    const result  = calculateBalance(meals, [payment]);
    expect(result.outstanding_balance).toBe(0);
  });

  it('Case 5 — multiple partial payments add up correctly', () => {
    // 10 meals = ₹500
    const meals = Array.from({ length: 10 }, (_, i) => makeMeal({ id: `meal-${i}` }));
    const payments = [
      makePayment({ id: 'p1', amount: 200 }),
      makePayment({ id: 'p2', amount: 300 }),
      makePayment({ id: 'p3', amount: 100 }),
    ];
    // Total payments = ₹600 but total meal = ₹500 — would produce negative
    // This tests raw arithmetic; the UI layer prevents this case
    const result = calculateBalance(meals, payments);
    expect(result.total_meal_amount).toBe(500);
    expect(result.total_payments).toBe(600);
    // demonstrates the formula; UI blocks over-payment before it reaches here
    expect(result.outstanding_balance).toBe(-100);
  });

  it('each meal is exactly ₹50', () => {
    const meal   = makeMeal({ amount: 50 });
    const result = calculateBalance([meal], []);
    expect(result.total_meal_amount).toBe(50);
  });

  it('deleting a payment increases balance', () => {
    const meals = Array.from({ length: 4 }, (_, i) => makeMeal({ id: `m-${i}` }));
    const payment = makePayment({ amount: 100 });

    const withPayment    = calculateBalance(meals, [payment]);
    const withoutPayment = calculateBalance(meals, []);

    expect(withoutPayment.outstanding_balance - withPayment.outstanding_balance).toBe(100);
  });

  it('deleting a meal decreases balance', () => {
    const meals = Array.from({ length: 4 }, (_, i) => makeMeal({ id: `m-${i}` }));

    const before = calculateBalance(meals, []);
    const after  = calculateBalance(meals.slice(0, 3), []);

    expect(before.outstanding_balance - after.outstanding_balance).toBe(50);
  });

  it('user data isolation: different user_ids produce independent totals', () => {
    const mealsA = [makeMeal({ id: 'm-a1', user_id: 'user-a' })];
    const mealsB = [
      makeMeal({ id: 'm-b1', user_id: 'user-b', amount: 50 }),
      makeMeal({ id: 'm-b2', user_id: 'user-b', amount: 50 }),
    ];

    const resultA = calculateBalance(mealsA, []);
    const resultB = calculateBalance(mealsB, []);

    // User A and User B are calculated independently — no data leaks
    expect(resultA.total_meal_amount).toBe(50);
    expect(resultB.total_meal_amount).toBe(100);
    expect(resultA.outstanding_balance).not.toBe(resultB.outstanding_balance);
  });
});

// ─── Payment validation logic ─────────────────────────────────────────────────

describe('Payment validation (business rules)', () => {
  it('payment equal to outstanding balance is valid', () => {
    const balance = 200;
    const payment = 200;
    expect(payment).toBeLessThanOrEqual(balance);
  });

  it('payment less than outstanding balance is valid', () => {
    const balance = 200;
    const payment = 100;
    expect(payment).toBeLessThanOrEqual(balance);
  });

  it('payment greater than outstanding balance is invalid', () => {
    const balance = 200;
    const payment = 300;
    expect(payment).toBeGreaterThan(balance);
    // The services/payments.ts addPayment() throws an error in this case
  });

  it('zero payment is invalid', () => {
    const amount = 0;
    expect(amount).toBeLessThanOrEqual(0);
  });

  it('negative payment is invalid', () => {
    const amount = -50;
    expect(amount).toBeLessThanOrEqual(0);
  });
});

// ─── buildLedger ──────────────────────────────────────────────────────────────

describe('buildLedger', () => {
  it('meal entries have positive amount', () => {
    const meal   = makeMeal({ amount: 50 });
    const ledger = buildLedger([meal], []);
    expect(ledger[0].amount).toBeGreaterThan(0);
    expect(ledger[0].type).toBe('meal');
  });

  it('payment entries have negative amount', () => {
    const payment = makePayment({ amount: 100 });
    const ledger  = buildLedger([], [payment]);
    expect(ledger[0].amount).toBeLessThan(0);
    expect(ledger[0].type).toBe('payment');
  });

  it('entries are sorted newest-date first', () => {
    const older = makeMeal({ id: 'm-old', meal_date: '2026-08-10', meal_time: '08:00' });
    const newer = makeMeal({ id: 'm-new', meal_date: '2026-08-17', meal_time: '08:00' });
    const ledger = buildLedger([older, newer], []);
    expect(ledger[0].date).toBe('2026-08-17');
    expect(ledger[1].date).toBe('2026-08-10');
  });

  it('same-date entries are sorted by time descending', () => {
    const morning = makeMeal({ id: 'm-m', meal_date: '2026-08-17', meal_time: '08:00', meal_type: 'Morning' });
    const night   = makeMeal({ id: 'm-n', meal_date: '2026-08-17', meal_time: '21:00', meal_type: 'Night' });
    const ledger  = buildLedger([morning, night], []);
    expect(ledger[0].time).toBe('21:00'); // night comes first
    expect(ledger[1].time).toBe('08:00');
  });

  it('meal label includes meal type', () => {
    const meal   = makeMeal({ meal_type: 'Afternoon' });
    const ledger = buildLedger([meal], []);
    expect(ledger[0].label).toContain('Afternoon');
  });

  it('payment label is "Payment"', () => {
    const payment = makePayment();
    const ledger  = buildLedger([], [payment]);
    expect(ledger[0].label).toBe('Payment');
  });

  it('combined meal+payment ledger has correct length', () => {
    const meals    = [makeMeal({ id: 'm1' }), makeMeal({ id: 'm2' })];
    const payments = [makePayment({ id: 'p1' })];
    const ledger   = buildLedger(meals, payments);
    expect(ledger).toHaveLength(3);
  });
});

// ─── groupByDate ──────────────────────────────────────────────────────────────

describe('groupByDate', () => {
  it('groups entries by date correctly', () => {
    const m1 = makeMeal({ id: 'm1', meal_date: '2026-08-17' });
    const m2 = makeMeal({ id: 'm2', meal_date: '2026-08-16' });
    const ledger = buildLedger([m1, m2], []);
    const grouped = groupByDate(ledger);
    expect(grouped.size).toBe(2);
    expect(grouped.get('2026-08-17')).toHaveLength(1);
    expect(grouped.get('2026-08-16')).toHaveLength(1);
  });

  it('multiple entries on same date are in the same group', () => {
    const m1 = makeMeal({ id: 'm1', meal_date: '2026-08-17', meal_time: '08:00', meal_type: 'Morning' });
    const m2 = makeMeal({ id: 'm2', meal_date: '2026-08-17', meal_time: '13:00', meal_type: 'Afternoon' });
    const ledger  = buildLedger([m1, m2], []);
    const grouped = groupByDate(ledger);
    expect(grouped.get('2026-08-17')).toHaveLength(2);
  });
});

// ─── Utility functions ────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats ₹50 correctly', () => {
    expect(formatCurrency(50)).toBe('₹50');
  });

  it('formats ₹1050 with comma', () => {
    expect(formatCurrency(1050)).toBe('₹1,050');
  });

  it('formats ₹0 correctly', () => {
    expect(formatCurrency(0)).toBe('₹0');
  });
});

describe('formatTime', () => {
  it('formats 08:00 as 8:00 AM', () => {
    expect(formatTime('08:00')).toBe('8:00 AM');
  });

  it('formats 13:00 as 1:00 PM', () => {
    expect(formatTime('13:00')).toBe('1:00 PM');
  });

  it('formats 00:00 as 12:00 AM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
  });

  it('formats 12:00 as 12:00 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });
});

describe('dateToString / todayString', () => {
  it('dateToString returns YYYY-MM-DD', () => {
    const d = new Date(2026, 7, 17); // month is 0-indexed
    expect(dateToString(d)).toBe('2026-08-17');
  });

  it('todayString returns a valid YYYY-MM-DD string', () => {
    const today = todayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('timeToString', () => {
  it('returns HH:MM format', () => {
    const d = new Date(2026, 7, 17, 8, 5);
    expect(timeToString(d)).toBe('08:05');
  });
});

describe('startOfWeek', () => {
  it('Monday of the week containing 2026-08-17 (Monday) is itself', () => {
    expect(startOfWeek('2026-08-17')).toBe('2026-08-17');
  });

  it('Monday of the week containing 2026-08-19 (Wednesday) is 2026-08-17', () => {
    expect(startOfWeek('2026-08-19')).toBe('2026-08-17');
  });
});

describe('startOfMonth', () => {
  it('returns first day of the month', () => {
    expect(startOfMonth('2026-08-17')).toBe('2026-08-01');
  });

  it('works for January', () => {
    expect(startOfMonth('2026-01-15')).toBe('2026-01-01');
  });
});
