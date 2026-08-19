-- =============================================================================
-- ChoreKanakku — Fix helper_invitations RLS policies
--
-- Problem: policies used "SELECT email FROM auth.users WHERE id = auth.uid()"
-- which fails because auth.users is not accessible to authenticated/anon roles.
--
-- Fix: use auth.email() — a built-in Supabase function that safely returns
-- the current authenticated user's email without querying auth.users directly.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================================

-- Drop the broken policies
DROP POLICY IF EXISTS "helper_inv_invitee_read"   ON public.helper_invitations;
DROP POLICY IF EXISTS "helper_inv_invitee_accept" ON public.helper_invitations;

-- Fixed: invitee can read invitations addressed to their email
CREATE POLICY "helper_inv_invitee_read"
  ON public.helper_invitations FOR SELECT
  USING (
    invitee_email = lower(auth.email())
  );

-- Fixed: invitee can accept (set helper_user_id + status) on pending invitations
CREATE POLICY "helper_inv_invitee_accept"
  ON public.helper_invitations FOR UPDATE
  USING (
    status = 'pending'
    AND invitee_email = lower(auth.email())
  )
  WITH CHECK (
    invitee_email = lower(auth.email())
  );

-- =============================================================================
-- END OF MIGRATION 004
-- =============================================================================
