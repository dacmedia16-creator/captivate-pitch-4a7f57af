import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "agency_admin" | "broker";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  tenant_id: string | null;
  role: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  appRole: AppRole | null;
  tenantName: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appRole, setAppRole] = useState<AppRole | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef<string | null>(null);

  const fetchUserData = async (userId: string) => {
    // Prevent duplicate concurrent fetches for the same user
    if (fetchingRef.current === userId) return;
    fetchingRef.current = userId;

    try {
      // Fetch profile and role in parallel
      const [profileRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url, tenant_id, role").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);

        if (profileRes.data.tenant_id) {
          const { data: tenantData } = await supabase.from("tenants").select("name").eq("id", profileRes.data.tenant_id).single();
          setTenantName(tenantData?.name ?? null);
        }
      }

      setAppRole((roleRes.data?.role as AppRole) ?? null);
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      fetchingRef.current = null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(() => fetchUserData(newSession.user.id), 0);
        } else {
          setProfile(null);
          setAppRole(null);
          setTenantName(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchUserData(existingSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setAppRole(null);
    setTenantName(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, appRole, tenantName, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
