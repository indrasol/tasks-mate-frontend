import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "tm.accessToken";
let cachedToken: string | null = null;

export function setToken(token: string) {
  cachedToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  if (cachedToken) return cachedToken;
  cachedToken = localStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export function removeToken() {
  cachedToken = null;
  localStorage.removeItem(TOKEN_KEY);
}

// Keep browser storage in sync with Supabase auth events
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.access_token) {
    setToken(session.access_token);
  } else {
    removeToken();
  }
});