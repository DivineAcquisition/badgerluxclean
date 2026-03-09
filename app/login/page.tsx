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
    if (!loading && user) router.push("/");
  }, [user, loading, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      signIn(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-7 h-7 rounded-lg bg-brand animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center mx-auto mb-4">
            <span className="text-black text-sm font-bold">BL</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            BadgerLuxClean
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">Data Command Center</p>
        </div>

        <div className="card-elevated p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-neutral-500 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
                placeholder="you@badgerluxecleaning.com"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-500 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 bg-white/[0.04] border border-white/10 rounded-lg px-4 text-white text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-brand hover:bg-brand/90 text-black font-semibold rounded-lg transition-all disabled:opacity-50 shadow-sm shadow-brand/20 hover:shadow-md hover:shadow-brand/30"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-xs text-neutral-600 text-center mt-4">
            Authorized for @badgerluxecleaning.com &amp; @divineacquisition.io
          </p>
        </div>
      </div>

      <p className="mt-12 text-xs text-neutral-700">
        Powered by <span className="text-brand/50 font-medium">DivineAcquisition</span>
      </p>
    </div>
  );
}
