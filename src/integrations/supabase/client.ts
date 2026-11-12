
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://mhyphzgzfijhjvptferr.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_ygB7P-HWTgI98Bs1xNUbYg_iiIx_hCb';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
