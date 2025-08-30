import { supabase } from "@/integrations/supabase/client";
import { api } from "@/services/apiService";
import { removeToken, setToken } from "@/services/tokenService";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, env } from "@/config";

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
  signInWithOtp: (identifier: string) => Promise<void>;
  verifyOtp: (identifier: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;

  /* NEW */
  forgotPassword: (identifier: string) => Promise<void>;
  resetPassword: (params: { email: string; newPassword: string; otp?: string }) => Promise<void>;
  resetPasswordWithToken: (params: { newPassword: string; accessToken: string }) => Promise<void>;
  exchangeCodeForSession: (accessToken: string) => Promise<{ user: User, session: Session }>;
  changePassword: (currentPwd: string, newPwd: string) => Promise<void>;
  onPasswordRecovery: (cb: (email: string) => void) => () => void;
}

const AuthContext = createContext<AuthContextType>(null as unknown as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// -------------------------
// Helpers
// -------------------------

// async function ensureBackendProfile(user: User) {
//   // 1️⃣  Try to fetch existing profile
//   try {
//     return await api.post<BackendProfile>(API_ENDPOINTS.LOGIN, { identifier: user.email });
//   } catch (err: any) {
//     // If not found, create and retry once
//     if (err.message?.includes("not found")) {
//       await ensureBackendProfileCreation(user);
//       return api.post<BackendProfile>(API_ENDPOINTS.LOGIN, { identifier: user.email });
//     }
//     throw err;
//   }
// }


async function ensureBackendProfileCreation(user: User) {
  // 1️⃣  Try to fetch existing profile
  try {
    return await api.post(API_ENDPOINTS.REGISTER_CONFIRM, {
      user_id: user.id,
      email: user.email,
      username: user.user_metadata?.username ?? user.email?.split("@")[0],
    });
  } catch (err: any) {    
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
    // 1️⃣ Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;

    let session = data?.session;
    let authUser = data?.user;

    // console.log(session, authUser)

    // ✅ Session and user returned = sign-up and login successful
    if (authUser && session) {
      setToken(session.access_token);
      ensureBackendProfileCreation(authUser).catch(console.error);
      return "User registered successfully";
    }

    if(authUser){
      ensureBackendProfileCreation(authUser).catch(console.error);
    }

    // ✅ No user = hard failure
    if (!authUser) {
      throw new Error("Sign-up failed – could not obtain an auth user.");
    }

    // ✅ Try fallback sign-in
    // const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({ email, password });
    // if (signinErr) {
    //   throw new Error(signinErr.message || "Sign-in after sign-up failed");
    // }

    // console.log(signinData)

    // session = signinData.session;
    // authUser = signinData.user;

    // if(authUser){
    //   ensureBackendProfileCreation(authUser).catch(console.error);
    // }

    // ✅ Still no session after sign-in means email confirmation is required
    if (!session) {
      return "User registered successfully. Please check your email for confirmation.";
    }

    // ✅ Success after fallback
    setToken(session.access_token);
    return "User registered successfully";
  };


  const getEmailFromIdentifier = async (identifier: string) => {
    let email = identifier;

    // If user entered username, resolve to email via backend (requires API key)
    if (!identifier.includes("@")) {
      try {
        const apiKey = env.SUPABASE_ANON_KEY;
        const resp = await api.post<{ email: string }>(API_ENDPOINTS.GET_EMAIL, { username: identifier }, {
          headers: { "X-API-Key": apiKey },
        });
        email = resp.email;
      } catch (err: any) {
        throw new Error(err.message || "Unable to resolve username to email");
      }
    }

    return email;
  };

  const signIn: AuthContextType["signIn"] = async (identifier, password) => {
    let email = await getEmailFromIdentifier(identifier);

    const { data: signData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Ensure backend profile exists (creates row only if missing)
    // if (signData?.user) {
    //   await ensureBackendProfileCreation(signData.user).catch(console.error);
    // }
    // onAuthStateChange will update local state next
  };

  const signInWithOtp: AuthContextType["signInWithOtp"] = async (identifier) => {
    let email = await getEmailFromIdentifier(identifier);

    const { data: signData, error } = await supabase.auth.signInWithOtp({
      email, options: {
        shouldCreateUser: false, // optional: auto-register new users
      },
    });
    if (error) throw error;
    // Ensure backend profile exists (creates row only if missing)
    // if (signData?.user) {
    //   await ensureBackendProfileCreation(signData.user).catch(console.error);
    // }
    // onAuthStateChange will update local state next
  };

  const verifyOtp: AuthContextType["verifyOtp"] = async (identifier, otp) => {
    let email = await getEmailFromIdentifier(identifier);

    const { data: signData, error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (error) throw error;
    // Ensure backend profile exists (creates row only if missing)
    // if (signData?.user) {
    //   await ensureBackendProfile(signData.user).catch(console.error);
    // }
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
    const apiKey = env.SUPABASE_ANON_KEY;
    const { email } = await api.post<{ email: string }>(API_ENDPOINTS.GET_EMAIL, { username: identifier }, {
      headers: { "X-API-Key": apiKey },
    });
    return email;
  };

  /* -------- auth API -------- */
  const forgotPassword = async (identifier: string) => {
    const email = await resolveIdentifierToEmail(identifier);
    //     console.log(APP_URL)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `/reset-password?email=${email}`,
    });
    if (error) throw error;
  };

  const resetPassword: AuthContextType["resetPassword"] = async ({ email, newPassword, otp }) => {
    if (otp) {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "recovery" });
      if (error) throw error;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  // const verifyOtp: AuthContextType["verifyOtp"] = async ({code }) => {
  //   const { data, error } = await supabase.auth.verifyOtp({
  //     type: "recovery",
  //     token: code,
  // });
  //   if (error) throw error;
  // };

  // const resetPasswordWithTokenOld: AuthContextType["resetPasswordWithToken"] = async ({ newPassword, accessToken }: { newPassword: string; accessToken: string }) => {
  //   const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       apikey: SUPABASE_ANON_KEY,
  //     },
  //     body: JSON.stringify({
  //       type: "recovery",
  //       token: accessToken,
  //       password: newPassword,
  //     }),
  //   });

  //   if (!response.ok) {
  //     const errorData = await response.json();
  //     throw new Error(errorData?.msg || "Failed to reset password");
  //   }

  //   return response.json();
  // }

  const exchangeCodeForSession: AuthContextType["exchangeCodeForSession"] = async (accessToken: string): Promise<{ user: User, session: Session }> => {
    const { data: session, error: exchangeError } = await supabase.auth.exchangeCodeForSession(accessToken);
    if (exchangeError) {
      console.error("Failed to exchange code for session:", exchangeError);
      throw exchangeError;
    }
    console.log("Session set successfully", session);
    // refreshToken();
    return session;
  }

  // const refreshToken: AuthContextType["refreshToken"] = async () => {
  //   const { data: session, error: refreshError } = await supabase.auth.refreshSession();
  //   if (refreshError){
  //     console.error("Failed to refresh session:", refreshError);
  //     throw refreshError;
  //   }
  //   console.log("Session refreshed successfully", session);
  //   return session;
  // }

  const resetPasswordWithToken: AuthContextType["resetPasswordWithToken"] = async ({ newPassword, accessToken }: { newPassword: string; accessToken: string }) => {
    if (!accessToken) {
      throw new Error("Missing reset token");
    }

    console.log("Reset token received:", accessToken);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      console.log("Session already exists", session);
    }

    if (!session && accessToken) {
      console.log("Exchanging code for session...");
      // Exchange the code for a session
      const { user, session } = await exchangeCodeForSession(accessToken);
      console.log("Session set successfully", session, user);
    }





    // // Set the session with the access token from reset link
    // const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: '' });
    // if (sessionError) {
    //   console.error("Failed to set session:", sessionError);
    //   throw sessionError;
    // }



    // Add slight delay to let Supabase sync session
    await new Promise((resolve) => setTimeout(resolve, 100));

    const { data: sessionPostExchange } = await supabase.auth.getSession();

    console.log("Session synced successfully", sessionPostExchange);

    console.log("Updating password...");

    // Now update password as authenticated user
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.error("Failed to update password:", error);
      throw error;
    }

    signOut();

    console.log("Password updated successfully");
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
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithOtp, verifyOtp, signOut, forgotPassword, resetPassword, resetPasswordWithToken, exchangeCodeForSession, changePassword, onPasswordRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}