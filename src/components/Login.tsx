"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface LoginProps {
  onSwitchToSignup: () => void;
}

export default function Login({ onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/shows");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login: handleSubmit called");
    setLoading(true);
    setError("");

    try {
      // Validate email domain
      if (!email.endsWith("@mahindrauniversity.edu.in")) {
        console.log("Login: Invalid email domain");
        setError("Only @mahindrauniversity.edu.in email addresses are allowed");
        return;
      }

      console.log("Login: Calling signIn");
      const { error } = await signIn(email, password);
      console.log("Login: signIn returned:", { error: !!error });

      if (error) {
        console.error("Sign in error:", error);
        setError(error.message);
      } else {
        console.log("Login: Sign in successful, waiting for auth state change");
        // Don't redirect here - let the useEffect handle it when user state updates
      }
    } catch (err) {
      console.error("Login: Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      console.log("Login: handleSubmit completed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Book your seats for the best shows
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="your.name@mahindrauniversity.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || authLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading || authLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Don&apos;t have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
