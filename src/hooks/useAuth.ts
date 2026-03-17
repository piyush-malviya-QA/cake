"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/types";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return false;
    }
    setLoading(false);
    return true;
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function getRole(): Promise<Role | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("employees")
      .select("role")
      .eq("id", user.id)
      .single();
    return (data?.role as Role) ?? null;
  }

  return { login, logout, getRole, loading, error };
}
