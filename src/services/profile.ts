import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';

/** Get the profile for the current authenticated user */
export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
}

/** Upsert (create or update) the profile for the current user */
export async function upsertProfile(displayName: string): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}
