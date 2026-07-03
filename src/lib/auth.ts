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
 * Returns the app role for the current user:
 * - Checks app_metadata.role set by admin (via Supabase dashboard or edge function)
 * - Falls back to 'guest' if not authenticated
 */
export async function getUserAppRole(): Promise<'admin' | 'supplier' | 'distributor' | 'guest'> {
  const session = await getSession();
  if (!session) return 'guest';
  const role = session.user?.app_metadata?.role as string | undefined;
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
