import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { setSentryUser } from "@/lib/sentryConfig";

type AppRole = "entreprise" | "facilitateur" | "admin" | null;

interface Profile {
  id: string;
  email: string;
  prenom: string | null;
  role: AppRole;
  onboarding_done: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  role: AppRole;
  signUp: (email: string, password: string, prenom?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Called by SubscriptionContext to reset its state on logout */
  registerSubscriptionReset: (fn: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const subscriptionResetRef = useRef<(() => void) | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, prenom, role, onboarding_done")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) {
        setProfile(data as Profile);
        setSentryUser({ id: data.id, email: data.email });
      }
    } catch {
      // silent — network may be down
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const registerSubscriptionReset = (fn: () => void) => {
    subscriptionResetRef.current = fn;
  };

  useEffect(() => {
    // ── PASSE A: Auth state listener — SIGNED_OUT triggers full cleanup + redirect ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          setProfile(null);
          // Reset subscription context
          subscriptionResetRef.current?.();
          // Clear React Query cache is done in signOut()
          setLoading(false);
          return;
        }

        if (event === "TOKEN_REFRESHED" && newSession?.user) {
          // Silently refreshed — no need to re-fetch profile
          setLoading(false);
          return;
        }

        if (newSession?.user) {
          setTimeout(() => fetchProfile(newSession.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Then get current session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, prenom?: string) => {
    // SEC: emailRedirectTo is hardcoded to production — prevents broken links
    // from preview/local environments landing in transactional emails.
    const redirectBase =
      import.meta.env.PROD
        ? "https://wiinupmax.com"
        : window.location.origin;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { prenom: prenom || "" },
        emailRedirectTo: `${redirectBase}/login?confirmed=true`,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // PASSE A: full cleanup before signOut
    setProfile(null);
    setUser(null);
    setSession(null);
    subscriptionResetRef.current?.();

    // Clear all Supabase localStorage keys to prevent stale session on back-button
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("sb-") || key.startsWith("supabase")) {
        localStorage.removeItem(key);
      }
    });

    await supabase.auth.signOut();
  };

  const role = profile?.role ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        role,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        registerSubscriptionReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
