-- =============================================================================
-- MealBalance — Initial Schema Migration
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================================

-- ─── 1. EXTENSIONS ────────────────────────────────────────────────────────────
-- uuid_generate_v4() is available via pgcrypto / uuid-ossp in Supabase by default
-- gen_random_uuid() is used here (built into PostgreSQL 13+)

-- ─── 2. CUSTOM TYPES ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE meal_type_enum AS ENUM ('Morning', 'Afternoon', 'Evening', 'Night');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. TABLE: profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

COMMENT ON TABLE public.profiles IS
  'One profile row per authenticated user. Created automatically on signup.';

-- ─── 4. TABLE: meals ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type   meal_type_enum NOT NULL,
  meal_date   DATE NOT NULL,
  meal_time   TIME NOT NULL,
  amount      NUMERIC(10, 2) NOT NULL DEFAULT 50.00
                CHECK (amount >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One meal type per user per day (prevents duplicate Morning/Afternoon/etc.)
  CONSTRAINT meals_unique_type_per_day UNIQUE (user_id, meal_date, meal_type)
);

COMMENT ON TABLE public.meals IS
  'One row per meal. Amount is always ₹50. One type allowed per day per user.';

-- ─── 5. TABLE: payments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_date  DATE NOT NULL,
  payment_time  TIME NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS
  'Records of manual payments entered by the user. NOT a payment gateway.';

-- ─── 6. INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meals_user_date
  ON public.meals (user_id, meal_date);

CREATE INDEX IF NOT EXISTS idx_meals_user_created
  ON public.meals (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_user_date
  ON public.payments (user_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_payments_user_created
  ON public.payments (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles (user_id);

-- ─── 7. UPDATED_AT TRIGGER FUNCTION ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Attach trigger to each table
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_meals_updated_at ON public.meals;
CREATE TRIGGER trg_meals_updated_at
  BEFORE UPDATE ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 8. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 9. ROW LEVEL SECURITY ────────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own"  ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ── meals ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "meals_select_own"  ON public.meals;
DROP POLICY IF EXISTS "meals_insert_own"  ON public.meals;
DROP POLICY IF EXISTS "meals_update_own"  ON public.meals;
DROP POLICY IF EXISTS "meals_delete_own"  ON public.meals;

CREATE POLICY "meals_select_own"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meals_insert_own"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meals_update_own"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meals_delete_own"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- ── payments ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_select_own"  ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own"  ON public.payments;
DROP POLICY IF EXISTS "payments_update_own"  ON public.payments;
DROP POLICY IF EXISTS "payments_delete_own"  ON public.payments;

CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_own"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_update_own"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_delete_own"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
