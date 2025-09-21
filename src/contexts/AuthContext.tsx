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
    console.log("AuthContext: Getting initial session...");
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        console.log("AuthContext: Initial session result:", {
          session: !!session,
          error,
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("AuthContext: Error getting initial session:", err);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: Auth state change:", event, {
        session: !!session,
      });
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
    console.log("AuthContext: signUp called with email:", email);
    // Validate email domain server-side
    if (!email.endsWith("@mahindrauniversity.edu.in")) {
      console.log("AuthContext: Invalid email domain");
      return {
        error: {
          message:
            "Only @mahindrauniversity.edu.in email addresses are allowed",
        } as AuthError,
      };
    }

    console.log("AuthContext: Calling supabase.auth.signUp");
    try {
      const result = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split("@")[0],
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Sign up timeout")), 30000)
        ),
      ]);
      console.log("AuthContext: signUp result:", {
        data: !!result.data,
        error: result.error,
      });
      return { error: result.error };
    } catch (err) {
      console.error("AuthContext: signUp error:", err);
      return {
        error: {
          message: err instanceof Error ? err.message : "Sign up failed",
        } as AuthError,
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log("AuthContext: signIn called with email:", email);
    // Validate email domain server-side
    if (!email.endsWith("@mahindrauniversity.edu.in")) {
      console.log("AuthContext: Invalid email domain");
      return {
        error: {
          message:
            "Only @mahindrauniversity.edu.in email addresses are allowed",
        } as AuthError,
      };
    }

    console.log("AuthContext: Calling supabase.auth.signInWithPassword");
    try {
      const result = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Sign in timeout")), 30000)
        ),
      ]);
      console.log("AuthContext: signIn result:", {
        data: !!result.data,
        error: result.error,
      });
      return { error: result.error };
    } catch (err) {
      console.error("AuthContext: signIn error:", err);
      return {
        error: {
          message: err instanceof Error ? err.message : "Sign in failed",
        } as AuthError,
      };
    }
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
