-- =============================================================================
-- MealBalance — Verification Queries
-- Run AFTER 001_initial_schema.sql to confirm everything is set up correctly.
-- These are READ-ONLY queries — safe to run at any time.
-- =============================================================================

-- 1. Confirm all three tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'meals', 'payments')
ORDER BY table_name;
-- Expected: 3 rows — meals, payments, profiles

-- 2. Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'meals', 'payments')
ORDER BY tablename;
-- Expected: rowsecurity = true for all three

-- 3. List all RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'meals', 'payments')
ORDER BY tablename, policyname;
-- Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)

-- 4. Confirm indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('meals', 'payments', 'profiles')
ORDER BY tablename, indexname;
-- Expected: idx_meals_user_date, idx_meals_user_created,
--           idx_payments_user_date, idx_payments_user_created,
--           idx_profiles_user_id

-- 5. Confirm triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
-- Expected: trg_profiles_updated_at, trg_meals_updated_at,
--           trg_payments_updated_at, trg_on_auth_user_created (on auth.users)

-- 6. Confirm meal_type_enum values
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'meal_type_enum')
ORDER BY enumsortorder;
-- Expected: Morning, Afternoon, Evening, Night
