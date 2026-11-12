
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL =
  'https://mhyphzgzfijhjvptferr.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_ygB7P-HWTgI98Bs1xNUbYg_iiIx_hCb';

function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request
        ? input.headers
        : undefined
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, name) => {
        headers.set(name, value);
      });
    }

    if (headers.get('Authorization') === `Bearer ${key}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', key);

    return fetch(input, { ...init, headers });
  };
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage:
        typeof window !== 'undefined'
          ? window.localStorage
          : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
