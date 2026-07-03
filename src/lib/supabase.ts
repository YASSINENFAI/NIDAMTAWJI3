import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Fallback to hardcoded values if env vars are not injected during build (Vite requires them at build time)
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://gusiakeoncxjzskjosjp.supabase.co';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1c2lha2VvbmN4anpza2pvc2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzQzMTQsImV4cCI6MjA5ODY1MDMxNH0.mWlyrqVixoAuKoKmEMIdYwI05Cp7PLswrxTHCQMKSJM';

export const supabaseConfigured = true;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
