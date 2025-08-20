import { createClient } from "@supabase/supabase-js";
// import type { Database } from "./types";

// Environment variables are injected by start-dev.sh (or your host)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_API_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail fast – makes mis-config obvious during development
  throw new Error("Supabase environment variables are missing");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: "supabase.auth.token",
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": "tasks-mate-frontend",
    },
  },
});