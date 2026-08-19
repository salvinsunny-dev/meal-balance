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

  const { data, error } = await supabase
    .from('helper_invitations')
    .select('*')
    .eq('helper_user_id', user.id)
    .eq('status', 'accepted');
  if (error) throw new Error(error.message);
  return data as HelperInvitation[];
}

/** Accept an invitation */
export async function acceptInvitation(invitationId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('helper_invitations')
    .update({ status: 'accepted', helper_user_id: user.id })
    .eq('id', invitationId);
  if (error) throw new Error(error.message);
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

/** Get display name of an owner by user_id (for helper UI) */
export async function getOwnerName(ownerId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', ownerId)
    .maybeSingle();
  return data?.display_name ?? 'Unknown';
}
