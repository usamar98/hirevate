"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseBrowserConfig } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  if (!hasSupabaseBrowserConfig()) {
    throw new Error("Supabase browser environment variables are not configured.");
  }

  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
