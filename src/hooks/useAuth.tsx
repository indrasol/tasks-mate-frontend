import { supabase } from "@/integrations/supabase/client";
import { api } from "@/services/apiService";
import { removeToken, setToken } from "@/services/tokenService";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../config";

// -------------------------
// Types
// -------------------------

export type BackendProfile = {
  user_id: string;
  username: string;
  email: string;
};

export type SignUpDto = {
  email: string;
  password: string;
  username: string;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (dto: SignUpDto) => Promise<string>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  /* NEW */
  forgotPassword: (identifier: string) => Promise<void>;
  resetPassword: (params: { email: string; newPassword: string; otp?: string }) => Promise<void>;
  changePassword: (currentPwd: string, newPwd: string) => Promise<void>;
  onPasswordRecovery: (cb: (email: string) => void) => () => void;
}

const AuthContext = createContext<AuthContextType>(null as unknown as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// -------------------------
// Helpers
// -------------------------

async function ensureBackendProfile(user: User) {
  // 1️⃣  Try to fetch existing profile
  try {
    return await api.post<BackendProfile>(API_ENDPOINTS.LOGIN, { identifier: user.email });
  } catch (err: any) {
    // If not found, create and retry once
    if (err.message?.includes("not found")) {
      await api.post(API_ENDPOINTS.REGISTER, {
        user_id: user.id,
        email: user.email,
        username: user.user_metadata?.username ?? user.email?.split("@")[0],
      });
      return api.post<BackendProfile>(API_ENDPOINTS.LOGIN, { identifier: user.email });
    }
    throw err;
  }
}

// -------------------------
// Provider
// -------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const prevUserRef = useRef<User | null>(null);


  /** Sync local state + localStorage whenever we get a fresh session */
  const handleSession = async (s: Session | null) => {
    setSession(s);
    // setUser(s?.user ?? null);

    // Only update user if changed
    const newUser = s?.user ?? null;
    if (
      (prevUserRef.current?.id !== newUser?.id) || // compare by id if available
      (!prevUserRef.current && newUser) ||
      (prevUserRef.current && !newUser)
    ) {
      setUser(newUser);
      prevUserRef.current = newUser;
    }

    // setUser(newUser);

    if (s?.access_token && s.user) {
      setToken(s.access_token);
    } else {
      removeToken();
    }
    setLoading(false);
  };

  // Bootstrap once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => handleSession(s));
    return () => subscription.unsubscribe();
  }, []);

  //---------------------------------------------------
  // Actions exposed to UI
  //---------------------------------------------------
  const signUp: AuthContextType["signUp"] = async ({ email, password, username }) => {
    // 1️⃣  Create auth user (no email confirmation)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;

    let session = data.session;
    let authUser = data.user;

    // 2️⃣  If no session returned (e.g., email confirmation disabled but SDK bug) – try direct sign-in once
    if (!session) {
      const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signinErr) {
        throw new Error(signinErr.message || "Sign-in after sign-up failed");
      }
      session = signinData.session;
      authUser = signinData.user;
    }

    if (!session || !authUser) {
      throw new Error("Sign-up failed – could not obtain an auth session.");
    }

    // 3️⃣  Persist JWT so next requests are authenticated automatically
    setToken(session.access_token);

    // 4️⃣  Add row to backend users table (token verified server-side)
    const { message } = await api.post<{ message: string }>(API_ENDPOINTS.REGISTER, {
      user_id: authUser.id,
      email,
      username,
    });

    // If email confirmation is disabled, Supabase will return a valid session
    if (data?.session && data?.user) {
      // Persist token immediately so subsequent requests include it
      setToken(data.session.access_token);
      // await ensureBackendProfile(data.user).catch(console.error);
    }

    return message;
  };

  const signIn: AuthContextType["signIn"] = async (identifier, password) => {
    let email = identifier;

    // If user entered username, resolve to email via backend (requires API key)
    if (!identifier.includes("@")) {
      try {
        const apiKey = import.meta.env.VITE_SUPABASE_API_KEY as string;
        const resp = await api.post<{ email: string }>(API_ENDPOINTS.GET_EMAIL, { username: identifier }, {
          headers: { "X-API-Key": apiKey },
        });
        email = resp.email;
      } catch (err: any) {
        throw new Error(err.message || "Unable to resolve username to email");
      }
    }

    const { data: signData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Ensure backend profile exists (creates row only if missing)
    if (signData?.user) {
      await ensureBackendProfile(signData.user).catch(console.error);
    }
    // onAuthStateChange will update local state next
  };

  const signOut: AuthContextType["signOut"] = async () => {
    await supabase.auth.signOut();
    removeToken();
    navigate("/");
  };

  //---------------------------------------------------
  // Actions exposed to UI
  //---------------------------------------------------

  /* -------- helpers -------- */
  const resolveIdentifierToEmail = async (identifier: string) => {
    if (identifier.includes("@")) return identifier;
    const apiKey = import.meta.env.VITE_SUPABASE_API_KEY as string;
    const { email } = await api.post<{ email: string }>(API_ENDPOINTS.GET_EMAIL, { username: identifier }, {
      headers: { "X-API-Key": apiKey },
    });
    return email;
  };

  /* -------- auth API -------- */
  const forgotPassword = async (identifier: string) => {
    const email = await resolveIdentifierToEmail(identifier);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const resetPassword: AuthContextType["resetPassword"] = async ({ email, newPassword, otp }) => {
    if (otp) {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      if (error) throw error;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const changePassword: AuthContextType["changePassword"] = async (currentPwd, newPwd) => {
    if (!user?.email) throw new Error("No active user");
    const { error: reAuthErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPwd,
    });
    if (reAuthErr) throw new Error("Wrong current password");
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) throw error;
  };

  const onPasswordRecovery: AuthContextType["onPasswordRecovery"] = (cb) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, session) => {
      if (ev === "PASSWORD_RECOVERY") cb(session?.user.email ?? "");
    });
    return () => subscription.unsubscribe();
  };

  /* -------- original signUp / signIn / signOut stay unchanged -------- */

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, forgotPassword, resetPassword, changePassword, onPasswordRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}