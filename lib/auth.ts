"use client";

import { useState, useEffect, useCallback } from "react";

const ALLOWED_DOMAINS = ["badgerluxecleaning.com", "divineacquisition.io"];
const SHARED_PASSWORD = "Badgerdcc2026!";
const STORAGE_KEY = "blx-auth";

interface AuthUser {
  email: string;
}

function getStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStored());
    setLoading(false);
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(domain)) {
      throw new Error("Access restricted to authorized domains");
    }
    if (password !== SHARED_PASSWORD) {
      throw new Error("Invalid password");
    }
    const u: AuthUser = { email: email.toLowerCase() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return { user, loading, signIn, signOut };
}
