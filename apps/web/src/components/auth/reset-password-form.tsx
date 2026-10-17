"use client";

import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

// No token: ask for the email and send a link. Token (from the emailed link): choose the new password.
export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (token && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading(true);
    if (token) {
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      setLoading(false);
      if (error) return setError("This link is invalid or has expired. Request a new one.");
      router.push("/sign-in");
      return;
    }
    // Always show the same confirmation so this can't be used to find out which emails have accounts
    await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-semibold leading-[1.15] tracking-tight">Check your inbox</h1>
        <p className="text-[15px] leading-normal text-ink-2">
          If an account exists for <b className="text-ink">{email.trim()}</b>, we sent a link to reset your password. It
          expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-semibold leading-[1.15] tracking-tight">
          {token ? "Choose a new password" : "Reset your password"}
        </h1>
        <p className="text-[15px] leading-normal text-ink-2">
          {token
            ? "You’ll sign in with this password from now on."
            : "Enter your email and we’ll send you a link to reset your password."}
        </p>
      </div>
      <div className="flex flex-col gap-1.75">
        <Label htmlFor={token ? "password" : "email"}>{token ? "New password" : "Email"}</Label>
        {token ? (
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-ink-3"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        ) : (
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            placeholder="you@organisation.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </div>
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription className="font-semibold text-foreground">{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}
        {token ? "Save password" : "Send link"}
      </Button>
      <Link href="/sign-in" className="text-[13.5px] font-bold text-ink-2 hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
