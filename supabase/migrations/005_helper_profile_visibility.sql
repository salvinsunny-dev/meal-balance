-- =============================================================================
-- ChoreKanakku — Migration 005
-- Fix 1: Allow helpers to read the owner's profile name (fixes "Unknown")
-- Fix 2: Add a DB function that creates the reverse invitation automatically
-- =============================================================================

-- ─── FIX 1: profiles SELECT policy ────────────────────────────────────────────
-- The current policy: "profiles_select_own" only allows auth.uid() = user_id
-- That means a helper cannot read the owner's display_name → shows "Unknown"
--
-- New policy: also allow reading a profile if the viewer is an accepted helper
-- for that profile's owner, OR if the viewer IS that profile's owner.

DROP POLICY IF EXISTS "profiles_select_own"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_linked" ON public.profiles;

CREATE POLICY "profiles_select_own_or_linked"
  ON public.profiles FOR SELECT
  USING (
    -- You can always read your own profile
    auth.uid() = user_id
    OR
    -- You can read profiles of people you help (you are an accepted helper for them)
    EXISTS (
      SELECT 1 FROM public.helper_invitations hi
      WHERE hi.owner_id       = profiles.user_id
        AND hi.helper_user_id = auth.uid()
        AND hi.status         = 'accepted'
    )
    OR
    -- You can read profiles of people who help you (they are accepted helpers for you)
    EXISTS (
      SELECT 1 FROM public.helper_invitations hi
      WHERE hi.owner_id  = auth.uid()
        AND hi.helper_user_id = profiles.user_id
        AND hi.status    = 'accepted'
    )
  );

-- ─── FIX 2: DB function to create reverse invitation ─────────────────────────
-- Called from the app after a helper accepts an invitation.
-- Creates the reverse row (owner_id = old helper, invitee_email = old owner email)
-- with status='accepted' and helper_user_id already set — no second accept needed.
-- Uses SECURITY DEFINER so it can read auth.users.email safely.

CREATE OR REPLACE FUNCTION public.create_reverse_invitation(
  p_original_invitation_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id        UUID;
  v_owner_email     TEXT;
  v_helper_user_id  UUID;
  v_helper_email    TEXT;
  v_permissions     TEXT[];
BEGIN
  -- Get the original invitation details
  SELECT owner_id, helper_user_id, permissions
  INTO   v_owner_id, v_helper_user_id, v_permissions
  FROM   public.helper_invitations
  WHERE  id = p_original_invitation_id
    AND  status = 'accepted';

  -- Nothing to do if invitation not found or not accepted
  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;

  -- Get emails from auth.users (safe because SECURITY DEFINER)
  SELECT email INTO v_owner_email  FROM auth.users WHERE id = v_owner_id;
  SELECT email INTO v_helper_email FROM auth.users WHERE id = v_helper_user_id;

  -- Only create reverse if it doesn't already exist
  INSERT INTO public.helper_invitations
    (owner_id, invitee_email, helper_user_id, status, permissions)
  VALUES
    (v_helper_user_id, lower(v_owner_email), v_owner_id, 'accepted', v_permissions)
  ON CONFLICT (owner_id, invitee_email) DO UPDATE
    SET status         = 'accepted',
        helper_user_id = v_owner_id,
        updated_at     = NOW();
END;
$$;

-- =============================================================================
-- END OF MIGRATION 005
-- =============================================================================
