import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};
