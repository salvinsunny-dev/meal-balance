# ChoreKanakku

**Chore** = food/meals · **Kanakku** = calculation/account

A production-ready, mobile-first cloud web application for tracking daily meals and monthly personal expenses.

> This application does **not** process real payments. It records payments and expenses for personal bookkeeping only.

---

## What it does

### 🍽️ Meal Tracker
- Record Morning, Afternoon, Evening, and Night meals
- Every meal costs exactly ₹50 (fixed)
- Track outstanding meal balance
- Record payments to reduce balance
- Prevent duplicate meal entries per day
- Friends can add meals on your behalf (helper system)

### 💸 Expense Tracker
- Add general monthly expenses (rent, groceries, electricity, etc.)
- 11 default categories + unlimited custom categories
- Monthly summaries with category breakdown
- Completely separate from meal tracking

### 📊 Insights
- Month-to-month expense comparison with % change
- 7-day meal activity chart
- Category analysis with progress bars
- Monthly summary table

### 🤝 Helper System
- Invite a friend by email to add meals on your behalf
- Friend accepts/declines from their account
- Owner can revoke access at any time
- Secure server-side permission enforcement

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email/password) |
| Deployment | Vercel |
| Testing | Vitest (39 tests) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           login, signup, forgot-password, update-password
│   ├── (app)/            dashboard, expenses, insights, history, settings, helper-meal
│   └── auth/callback/    Supabase auth callback handler
├── components/
│   ├── ui/               Button, Input, Card, Modal, Alert, ConfirmDialog, LoadingSpinner
│   ├── layout/           AppHeader, BottomNav
│   ├── dashboard/        BalanceCard, TodayMeals, RecentActivity
│   ├── meals/            MealForm
│   ├── payments/         PaymentForm
│   ├── expenses/         ExpenseForm, CategoryManager
│   └── helpers/          ConnectedHelpers, PendingInvitations
├── hooks/
│   ├── useBalance.ts     Meal + payment data + balance calculation
│   └── useExpenses.ts    Expense + category data + monthly summaries
├── lib/
│   ├── constants.ts      APP_NAME, meal price, categories
│   ├── utils.ts          Business logic, formatters, calculators
│   └── supabase/         Browser client, server client
├── services/
│   ├── meals.ts          Meal CRUD (supports helper insertion)
│   ├── payments.ts       Payment CRUD with balance validation
│   ├── expenses.ts       Expense + category CRUD with auto-seed
│   ├── helpers.ts        Invitation flow (invite/accept/revoke)
│   └── profile.ts        Profile upsert
└── types/index.ts        All TypeScript interfaces
```

---

## Database Schema

### `profiles` — one per user, auto-created on signup
### `meals` — daily meal records with `added_by` for helper attribution
### `payments` — payment records against meal balance
### `helper_invitations` — owner invites helper; helper accepts/declines
### `expense_categories` — per-user categories (11 defaults + custom)
### `expenses` — general expense records with category reference

All tables have Row Level Security (RLS) — users can only access their own data.

Helper insert policy: a helper can only insert a meal for an owner if an accepted invitation exists with `ADD_MEAL` permission.

---

## Local Development

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/meal-balance.git
cd meal-balance
npm install
```

### 2. Set environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL and anon key
```

### 3. Run database migrations
In Supabase Dashboard → SQL Editor, run both files in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/003_chore_kanakku_enhancements.sql`

### 4. Start dev server
```bash
npm run dev
# Open http://localhost:3000
```

---

## Running Tests
```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests cover: balance calculation, payment validation, ledger building, date utilities, currency formatting — 39 tests total.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import repo at vercel.com
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy
5. Update Supabase → Authentication → URL Configuration with your Vercel URL

---

## Security

- RLS enforced at database level — no client-side trust
- Helper permissions checked server-side via Supabase policies
- No service-role key exposed to browser
- All secrets in `.env.local` (gitignored) and Vercel env vars
- Payment validation prevents overpayment
- Duplicate meal prevention at both app and DB level

---

## Future Improvements

- Push notifications for daily meal reminders
- Export expenses to CSV
- Dark mode
- Configurable meal price per user
- Shared household expense splitting

---

*ChoreKanakku records and calculates meal costs and personal expenses but does NOT process, transmit, or handle any real financial transactions.*
