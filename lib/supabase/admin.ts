import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-initialized admin client with service role for server-side operations
// This bypasses RLS policies - use only in secure server contexts like webhooks

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
    }

    if (!supabaseServiceRoleKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
    }

    console.log("[Supabase Admin] Initializing admin client");

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _supabaseAdmin;
}

// For backwards compatibility - lazy getter
export const supabaseAdmin = {
  get from() {
    return getSupabaseAdmin().from.bind(getSupabaseAdmin());
  },
  get auth() {
    return getSupabaseAdmin().auth;
  },
};
