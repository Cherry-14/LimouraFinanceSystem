// Re-export the SSR-aware clients for convenience.
// For Server Components / Route Handlers: use createClient from utils/supabase/server
// For Client Components:                  use createClient from utils/supabase/client
export { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
export { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";
