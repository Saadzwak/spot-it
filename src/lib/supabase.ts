// Client Supabase — créé PARESSEUSEMENT et seulement si hasSupabase().
// En M0 (USE_BACKEND=false) il n'est jamais instancié → zéro réseau, zéro dépendance runtime.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ENV, hasSupabase } from './env';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabase()) return null;
  if (_client) return _client;
  _client = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return _client;
}
