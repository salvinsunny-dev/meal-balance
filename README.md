# MealBalance

A production-ready, mobile-first cloud web application for tracking daily meals and outstanding balances.

> **This application does not process real payments.** It simply lets you record that a payment happened outside the app, and subtracts that amount from your outstanding balance.

---

## Features

- **Meal tracking** — record Morning, Afternoon, Evening, and Night meals
- **Fixed price** — every meal costs ₹50 (configurable in constants)
- **Automatic calculation** — total meal amount = meals × ₹50
- **Payment recording** — log payments to reduce your outstanding balance
- **Partial payments** — multiple payments supported
- **Balance protection** — payment cannot exceed outstanding balance
- **Duplicate prevention** — one meal type per day per user
- **Complete history** — combined ledger of meals and payments with filters
- **Statistics** — meal type distribution, monthly summary, 7-day chart
- **Multi-user** — each user sees only their own data (Supabase RLS)
- **PWA** — installable as a home screen app on Android and iOS
- **Mobile-first** — designed for one-handed phone use

---

## Technology Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Framework  | Next.js 16 (App Router)       |
| Language   | TypeScript (strict)           |
| Styling    | Tailwind CSS v4               |
| Database   | Supabase PostgreSQL           |
| Auth       | Supabase Auth (email/password)|
| Deployment | Vercel                        |
| Testing    | Vitest                        |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/          — login, signup, forgot-password, update-password
│   ├── (app)/           — dashboard, history, statistics, settings
│   ├── auth/callback/   — Supabase OAuth / email confirmation handler
│   └── layout.tsx       — root layout with PWA metadata
├── components/
│   ├── ui/              — Button, Input, Card, Modal, Alert, ConfirmDialog, LoadingSpinner
│   ├── layout/          — AppHeader, BottomNav
│   ├── dashboard/       — BalanceCard, TodayMeals, RecentActivity
│   ├── meals/           — MealForm
│   └── payments/        — PaymentForm
├── hooks/
│   └── useBalance.ts    — fetches meals + payments, computes balance
├── lib/
│   ├── constants.ts     — MEAL_PRICE, MEAL_TYPES, icons
│   ├── utils.ts         — calculateBalance, buildLedger, formatters
│   └── supabase/        — browser client, server client
├── services/
│   ├── meals.ts         — CRUD for meals table
│   ├── payments.ts      — CRUD for payments table
│   └── profile.ts       — profile upsert
└── types/
    └── index.ts         — all TypeScript interfaces
```

---

## Database Schema

### `profiles`
| Column       | Type        | Notes                        |
|--------------|-------------|------------------------------|
| id           | UUID PK     | auto-generated               |
| user_id      | UUID        | references auth.users        |
| display_name | TEXT        | nullable                     |
| created_at   | TIMESTAMPTZ |                              |
| updated_at   | TIMESTAMPTZ |                              |

### `meals`
| Column     | Type              | Notes                        |
|------------|-------------------|------------------------------|
| id         | UUID PK           |                              |
| user_id    | UUID              | references auth.users        |
| meal_type  | meal_type_enum    | Morning/Afternoon/Evening/Night |
| meal_date  | DATE              |                              |
| meal_time  | TIME              |                              |
| amount     | NUMERIC(10,2)     | always 50.00                 |
| created_at | TIMESTAMPTZ       |                              |
| updated_at | TIMESTAMPTZ       |                              |

Unique constraint: `(user_id, meal_date, meal_type)` — prevents duplicate meal types per day.

### `payments`
| Column       | Type          | Notes                        |
|--------------|---------------|------------------------------|
| id           | UUID PK       |                              |
| user_id      | UUID          | references auth.users        |
| amount       | NUMERIC(10,2) | must be > 0                  |
| payment_date | DATE          |                              |
| payment_time | TIME          |                              |
| note         | TEXT          | nullable                     |
| created_at   | TIMESTAMPTZ   |                              |
| updated_at   | TIMESTAMPTZ   |                              |

---

## Balance Calculation

```
total_meal_amount   = SUM(meals.amount)         — always meals × ₹50
total_payments      = SUM(payments.amount)
outstanding_balance = total_meal_amount - total_payments
```

The balance is always computed from the ledger. There is no manually editable balance field.

---

## Authentication

Supabase Auth with email/password. Row Level Security (RLS) ensures:
- `SELECT`, `INSERT`, `UPDATE`, `DELETE` are all restricted to `auth.uid() = user_id`
- No user can access another user's meals, payments, or profile

---

## Environment Variables

| Variable                      | Where to get it                              | Browser-safe? |
|-------------------------------|----------------------------------------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | Supabase → Project Settings → API → URL      | ✅ Yes        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key | ✅ Yes      |

**Never** add `SUPABASE_SERVICE_ROLE_KEY` to `NEXT_PUBLIC_*` variables or commit it to Git.

---

## Local Development Setup

### 1. Prerequisites

```bash
node --version   # v18 or higher
npm --version
git --version
```

### 2. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/meal-balance.git
cd meal-balance
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase URL and anon key (see Supabase Setup below).

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup

### 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose a project name (e.g. `meal-balance`)
4. Set a strong **database password** — save this somewhere safe
5. Select a **region** close to you
6. Click **Create new project** and wait ~2 minutes

### 2. Get your API credentials

1. In your Supabase project, click **Project Settings** (gear icon)
2. Click **API**
3. Copy:
   - **Project URL** → paste into `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → paste into `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run the database migration

1. In Supabase Dashboard, click **SQL Editor** → **New query**
2. Open `supabase/migrations/001_initial_schema.sql` from this project
3. Copy the entire contents and paste into the SQL editor
4. Click **Run**

You should see: `Success. No rows returned`

### 4. Verify the migration

Run the queries in `supabase/migrations/002_verification_queries.sql` to confirm:
- All 3 tables exist (`profiles`, `meals`, `payments`)
- RLS is enabled on all tables
- 4 policies exist per table
- All indexes exist

### 5. Configure Authentication

1. In Supabase Dashboard, click **Authentication** → **Providers**
2. Confirm **Email** is enabled
3. Under **Authentication** → **URL Configuration**, set:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: add `http://localhost:3000/**`
4. Under **Authentication** → **Email Templates** → **Confirm signup**:
   - For development, you can disable email confirmation:
     **Authentication** → **Settings** → toggle off **Enable email confirmations**

---

## Database Migration Instructions

The migration file creates everything from scratch:

```sql
-- Creates: meal_type_enum, profiles, meals, payments tables
-- Creates: indexes, triggers, auto-profile-on-signup function
-- Enables: RLS on all tables
-- Creates: 4 RLS policies per table (SELECT / INSERT / UPDATE / DELETE)
```

To apply:
1. Supabase Dashboard → SQL Editor → New Query
2. Paste entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click Run

To re-run (drops and recreates policies cleanly — safe to run multiple times):  
The migration uses `IF NOT EXISTS` and `DROP POLICY IF EXISTS` so it is idempotent.

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/meal-balance.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Select your `meal-balance` repository
4. Vercel will auto-detect **Next.js** — confirm and proceed
5. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Set scope to **Production** (and optionally **Preview**)
7. Click **Deploy**

### 3. Update Supabase auth URLs after deployment

Once deployed, Vercel gives you a URL like `https://meal-balance.vercel.app`.

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel production URL
3. Add your Vercel URL to **Redirect URLs**: `https://meal-balance.vercel.app/**`
4. Save

### 4. Test production

- Sign up with a new account
- Add meals — verify ₹50 is auto-applied
- Record a payment — verify balance decreases
- Try to record a payment exceeding balance — should be rejected
- Try adding the same meal type twice on the same day — should be blocked

---

## Testing

```bash
npm test          # run all tests once
npm run test:watch  # watch mode during development
```

Tests cover:
- ₹50 fixed meal price
- Balance calculation (multiple scenarios)
- Multiple partial payments
- Payment exceeding balance (should be flagged)
- Deleting meals/payments updates balance
- Ledger sorting (newest first)
- Utility functions (formatCurrency, formatTime, etc.)

---

## Security Notes

- All database queries are scoped with Supabase RLS — server enforced, not just frontend
- No service-role key is ever exposed to the browser
- All environment secrets are stored in `.env.local` (gitignored) and Vercel environment variables
- Input validation happens both on the client and in service functions
- SQL injection is not possible — all queries use Supabase's parameterized client
- Payment amount validation prevents exceeding the outstanding balance
- Duplicate meal prevention uses a database-level unique constraint

---

## Future Improvements

- Monthly reports / export to CSV
- Push notifications for daily meal reminders
- Dark mode
- Multiple meal price tiers (configurable per user)
- WhatsApp or email summary
- Admin dashboard for shared household tracking

---

## License

MIT — free to use and modify for personal projects.

---

*MealBalance records payment amounts but does NOT process, transmit, or handle any real financial transactions. It is a personal bookkeeping tool only.*
