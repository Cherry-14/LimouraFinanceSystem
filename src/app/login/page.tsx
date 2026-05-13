"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [email, setEmail] = React.useState("admin@limoura.studio");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Invalid credentials");
      }
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Editorial side */}
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white px-12 py-10 relative overflow-hidden">
        <div className="flex flex-col gap-2">
          <span className="display-serif text-3xl leading-none">Limoura</span>
          <span className="text-2xs uppercase tracking-[0.24em] text-ink-400">Creative Studio</span>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="display-serif text-4xl leading-tight">
            Where Amazon brands meet
            <em className="italic text-ink-300"> deliberate craft.</em>
          </p>
          <p className="text-sm text-ink-400 mt-6 max-w-sm">
            Internal financial operations — sales tracking, profitability analysis, and reporting for the studio.
          </p>
        </div>
        <div className="text-2xs text-ink-500 uppercase tracking-[0.2em]">
          Admin Access · v1.0
        </div>
        {/* subtle pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, white 0, white 1px, transparent 1px, transparent 24px)",
          }}
        />
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-12 lg:py-0">
        <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <span className="text-2xs uppercase tracking-[0.18em] text-ink-500">Sign in</span>
            <h1 className="display-serif text-4xl text-ink leading-none">Welcome back</h1>
            <p className="text-sm text-ink-500">
              Enter your admin credentials to access the dashboard.
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 text-negative px-3 py-2 text-xs">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <p className="text-2xs text-ink-500 leading-relaxed">
            Default credentials (dev): <span className="font-mono text-ink-700">admin@limoura.studio</span> /{" "}
            <span className="font-mono text-ink-700">changeme</span>
            <br />
            Change in <span className="font-mono text-ink-700">.env</span> before deploying.
          </p>
        </form>
      </div>
    </div>
  );
}
