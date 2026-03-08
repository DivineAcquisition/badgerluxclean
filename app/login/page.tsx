"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-bg flex items-center justify-center">
        <p className="text-brand-gold animate-pulse">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-brand-card rounded-xl p-8 border border-brand-gold/20">
        <h1 className="text-center text-2xl font-bold tracking-[4px] text-brand-gold mb-1">
          BADGERLUXCLEAN
        </h1>
        <p className="text-center text-xs text-gray-500 mb-8">
          Data Command Center
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#222] text-white rounded-md px-4 py-2.5 text-sm border border-transparent focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 outline-none transition-colors"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase text-gray-500 tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#222] text-white rounded-md px-4 py-2.5 text-sm border border-transparent focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-brand-red text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-gold text-black font-bold py-2.5 rounded-md hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? "Signing In…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
