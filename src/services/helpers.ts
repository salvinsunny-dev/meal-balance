import { createClient } from '@/lib/supabase/client';
import type { HelperInvitation } from '@/types';

// ─── Owner-side operations ────────────────────────────────────────────────────

/** Get all invitations the owner has sent */
export async function getMyInvitations(): Promise<HelperInvitation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('helper_invitations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as HelperInvitation[];
}

/** Invite a friend by email (owner sends invite) */
export async function inviteHelper(email: string): Promise<HelperInvitation> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (email.toLowerCase() === user.email?.toLowerCase()) {
    throw new Error("You can't invite yourself.");
  }

  const { data, error } = await supabase
    .from('helper_invitations')
    .upsert(
      {
        owner_id:      user.id,
        invitee_email: email.toLowerCase().trim(),
        status:        'pending',
        permissions:   ['ADD_MEAL'],
      },
      { onConflict: 'owner_id,invitee_email' },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as HelperInvitation;
}

/** Revoke a helper's access */
export async function revokeHelper(invitationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('helper_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);
  if (error) throw new Error(error.message);
}

/** Re-enable a previously revoked invitation */
export async function reinstateHelper(invitationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('helper_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId);
  if (error) throw new Error(error.message);
}

/** Delete invitation entirely */
export async function deleteInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('helper_invitations')
    .delete()
    .eq('id', invitationId);
  if (error) throw new Error(error.message);
}

// ─── Helper-side operations ───────────────────────────────────────────────────

/** Get all pending invitations addressed to the current user's email */
export async function getMyPendingInvitations(): Promise<HelperInvitation[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return [];

  const { data, error } = await supabase
    .from('helper_invitations')
    .select('*')
    .eq('invitee_email', user.email.toLowerCase())
    .eq('status', 'pending');
  if (error) throw new Error(error.message);
  return data as HelperInvitation[];
}

/** Get all accepted invitations for this helper (accounts they can add meals to) */
export async function getMyHelperAccess(): Promise<HelperInvitation[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch invitations where I am the helper
  const { data, error } = await supabase
    .from('helper_invitations')
    .select('*')
    .eq('helper_user_id', user.id)
    .eq('status', 'accepted');
  if (error) throw new Error(error.message);
  return (data ?? []) as HelperInvitation[];
}

/** Accept an invitation.
 *  Also calls the DB function create_reverse_invitation() which creates the
 *  reverse row so the original invitee can NOW also add meals for the owner —
 *  making the connection two-way automatically. No second invitation needed.
 */
export async function acceptInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Step 1 — Mark invitation as accepted and record who accepted
  const { error: acceptError } = await supabase
    .from('helper_invitations')
    .update({ status: 'accepted', helper_user_id: user.id })
    .eq('id', invitationId);
  if (acceptError) throw new Error(acceptError.message);

  // Step 2 — Create the reverse invitation via the SECURITY DEFINER function
  // This lets the original owner also add meals for the helper (two-way)
  const { error: reverseError } = await supabase.rpc(
    'create_reverse_invitation',
    { p_original_invitation_id: invitationId },
  );
  // Non-fatal: reverse creation failing should not break the accept flow
  if (reverseError) {
    console.warn('Could not create reverse invitation:', reverseError.message);
  }
}

/** Decline an invitation */
export async function declineInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('helper_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);
  if (error) throw new Error(error.message);
}

/**
 * Get display name of any user by user_id.
 * After migration 005, connected users can read each other's profiles.
 * Falls back to email-prefix if display_name is null, then to fallbackEmail param.
 */
export async function getOwnerName(
  userId: string,
  fallbackEmail?: string,
): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (data?.display_name) return data.display_name;
  if (fallbackEmail) return fallbackEmail.split('@')[0];
  return 'Friend';
}

/** Derive a readable name from an email address (part before @) */
export function nameFromEmail(email: string): string {
  return email.split('@')[0] ?? email;
}
