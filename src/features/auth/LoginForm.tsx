"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.push("/billing");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎂</div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          Sweet Delights
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Sign in to your account
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />

      <Button
        type="submit"
        disabled={loading}
        className="w-full justify-center mt-2"
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
