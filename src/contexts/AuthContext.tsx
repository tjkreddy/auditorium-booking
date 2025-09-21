"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mounted: boolean;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: AuthError | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signInWithProvider: (
    provider: "google" | "microsoft"
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create/update user profile when user signs up or signs in
      if (
        session?.user &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        // Validate email domain server-side
        if (!session.user.email?.endsWith("@mahindrauniversity.edu.in")) {
          console.error("Invalid email domain:", session.user.email);
          // Sign out the user if they have an invalid email
          await supabase.auth.signOut();
          return;
        }

        const { error } = await supabase.from("users").upsert({
          id: session.user.id,
          email: session.user.email,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0],
        });

        if (error) {
          console.error("Error creating user profile:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    // Validate email domain server-side
    if (!email.endsWith("@mahindrauniversity.edu.in")) {
      return { error: { message: "Only @mahindrauniversity.edu.in email addresses are allowed" } as AuthError };
    }

    // For development, disable email confirmation
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Validate email domain server-side
    if (!email.endsWith("@mahindrauniversity.edu.in")) {
      return { error: { message: "Only @mahindrauniversity.edu.in email addresses are allowed" } as AuthError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithProvider = async (provider: "google" | "microsoft") => {
    const { error } = await supabase.auth.signInWithOAuth({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: provider as any, // Microsoft is supported but not in the type definition
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    session,
    loading,
    mounted,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
