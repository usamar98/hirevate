import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseAdminConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminConfig()) return null;

  // The service role key is only created in server-only modules and never imported by client code.
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
