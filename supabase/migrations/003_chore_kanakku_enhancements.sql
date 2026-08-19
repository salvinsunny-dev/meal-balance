-- =============================================================================
-- ChoreKanakku — Enhancement Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run on top of existing data — uses IF NOT EXISTS + additive changes only
-- =============================================================================

-- ─── 1. ADD added_by TO meals (nullable for backward compat with existing rows) ──
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Back-fill: existing meals were added by their owner
UPDATE public.meals SET added_by = user_id WHERE added_by IS NULL;

-- ─── 2. TABLE: helper_invitations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.helper_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email   TEXT NOT NULL,
  helper_user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','revoked')),
  permissions     TEXT[] NOT NULL DEFAULT ARRAY['ADD_MEAL'],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One active invitation per owner+email at a time
  CONSTRAINT helper_invitations_owner_email_unique UNIQUE (owner_id, invitee_email)
);

COMMENT ON TABLE public.helper_invitations IS
  'Owner invites a friend (helper) by email. Helper can add meals to owner account.';

-- ─── 3. INDEXES for helper_invitations ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_helper_inv_owner
  ON public.helper_invitations (owner_id);
CREATE INDEX IF NOT EXISTS idx_helper_inv_email
  ON public.helper_invitations (invitee_email);
CREATE INDEX IF NOT EXISTS idx_helper_inv_helper
  ON public.helper_invitations (helper_user_id);

-- ─── 4. TRIGGER updated_at for helper_invitations ────────────────────────────
DROP TRIGGER IF EXISTS trg_helper_invitations_updated_at ON public.helper_invitations;
CREATE TRIGGER trg_helper_invitations_updated_at
  BEFORE UPDATE ON public.helper_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 5. RLS for helper_invitations ────────────────────────────────────────────
ALTER TABLE public.helper_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "helper_inv_owner_all"    ON public.helper_invitations;
DROP POLICY IF EXISTS "helper_inv_invitee_read" ON public.helper_invitations;
DROP POLICY IF EXISTS "helper_inv_invitee_accept" ON public.helper_invitations;

-- Owner can do everything with their own invitations
CREATE POLICY "helper_inv_owner_all"
  ON public.helper_invitations FOR ALL
  USING  (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Invitee can read invitations addressed to their email
CREATE POLICY "helper_inv_invitee_read"
  ON public.helper_invitations FOR SELECT
  USING (
    invitee_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Invitee can accept (update helper_user_id + status) on pending invitations for their email
CREATE POLICY "helper_inv_invitee_accept"
  ON public.helper_invitations FOR UPDATE
  USING (
    status = 'pending'
    AND invitee_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    invitee_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- ─── 6. HELPER MEAL INSERT POLICY ─────────────────────────────────────────────
-- A helper may insert a meal for an owner if:
--   a) they have an accepted invitation from that owner with ADD_MEAL permission
--   b) the user_id in the new row is the owner (not the helper)
--   c) added_by is set to the helper's own uid

-- First drop the old simple insert policy on meals
DROP POLICY IF EXISTS "meals_insert_own"   ON public.meals;
DROP POLICY IF EXISTS "meals_helper_insert" ON public.meals;

-- Owner can insert their own meals (user_id = auth.uid())
CREATE POLICY "meals_insert_own"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Helper can insert meals for an owner they have permission for
CREATE POLICY "meals_helper_insert"
  ON public.meals FOR INSERT
  WITH CHECK (
    -- The meal belongs to the owner, not the inserter
    user_id <> auth.uid()
    -- The inserter is marked as who added it
    AND added_by = auth.uid()
    -- There exists an accepted invitation from owner → current user with ADD_MEAL
    AND EXISTS (
      SELECT 1 FROM public.helper_invitations hi
      WHERE hi.owner_id      = meals.user_id
        AND hi.helper_user_id = auth.uid()
        AND hi.status         = 'accepted'
        AND 'ADD_MEAL'        = ANY(hi.permissions)
    )
  );

-- ─── 7. TABLE: expense_categories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '📦',
  color      TEXT NOT NULL DEFAULT 'bg-gray-500',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expense_categories_user_name_unique UNIQUE (user_id, name)
);

COMMENT ON TABLE public.expense_categories IS
  'Per-user expense categories. Seeded with defaults on first use.';

CREATE INDEX IF NOT EXISTS idx_expense_cats_user
  ON public.expense_categories (user_id);

DROP TRIGGER IF EXISTS trg_expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER trg_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expense_cats_select_own" ON public.expense_categories;
DROP POLICY IF EXISTS "expense_cats_insert_own" ON public.expense_categories;
DROP POLICY IF EXISTS "expense_cats_update_own" ON public.expense_categories;
DROP POLICY IF EXISTS "expense_cats_delete_own" ON public.expense_categories;

CREATE POLICY "expense_cats_select_own" ON public.expense_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expense_cats_insert_own" ON public.expense_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expense_cats_update_own" ON public.expense_categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expense_cats_delete_own" ON public.expense_categories FOR DELETE USING (auth.uid() = user_id);

-- ─── 8. TABLE: expenses ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.expenses IS
  'User expense records. Each belongs to a category. NOT a payment gateway.';

CREATE INDEX IF NOT EXISTS idx_expenses_user_date
  ON public.expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_cat
  ON public.expenses (user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_created
  ON public.expenses (user_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON public.expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_own" ON public.expenses;

CREATE POLICY "expenses_select_own" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert_own" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update_own" ON public.expenses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_delete_own" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- END OF MIGRATION 003
-- =============================================================================
