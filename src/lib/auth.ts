import { supabase } from './supabase';

// ─── Auth helpers ─────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Returns the app role for the current user.
 * Reads directly from `user_profiles` (the single source of truth for roles)
 * instead of the JWT's app_metadata, which only updates on token refresh and
 * can silently drift out of sync after an admin changes a user's role.
 */
export async function getUserAppRole(): Promise<'admin' | 'supplier' | 'distributor' | 'guest'> {
  const session = await getSession();
  if (!session) return 'guest';
  const { data, error } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (error || !data) return 'guest';
  const role = data.role as string;
  if (role === 'admin' || role === 'supplier' || role === 'distributor') return role;
  return 'guest';
}

/**
 * For supplier/distributor: returns the partner ID linked to this user
 */
export async function getLinkedPartnerId(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', session.user.id)
    .single();
  if (error) return null;
  return data?.id ?? null;
}
