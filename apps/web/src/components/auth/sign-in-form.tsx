"use client";

import { ArrowLeft, ArrowUpRight, CircleAlert, Eye, EyeOff, Loader2, Lock, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { GithubIcon } from "./github-icon";
import { GoogleIcon } from "./google-icon";

type Step = "form" | "verify";
type Provider = "google" | "github";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 30;

export function SignInForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"email" | Provider | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState("");

  const { data: session } = authClient.useSession();
  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Absolute URLs: the API lives on another origin and redirects back to us after verify / OAuth
  const dashboardUrl = () => `${window.location.origin}/dashboard`;

  async function oauth(provider: Provider) {
    setLoading(provider);
    setError("");
    const { error } = await authClient.signIn.social({ provider, callbackURL: dashboardUrl() });
    if (error) {
      setError(error.message ?? "Could not start sign-in. Try again.");
      setLoading(null);
    }
  }

  // Sign-in and sign-up are separate so a failed login never triggers an email to the account owner.
  // Better Auth answers sign-up generically (no account enumeration): new and existing emails both land on "check your inbox".
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(trimmed ? "That doesn’t look like a full email address." : "Enter your email to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading("email");
    setError("");

    if (mode === "signin") {
      const signIn = await authClient.signIn.email({ email: trimmed, password, callbackURL: dashboardUrl() });
      if (!signIn.error) {
        router.push("/dashboard");
        return;
      }
      setLoading(null);
      if (signIn.error.code === "EMAIL_NOT_VERIFIED") {
        setNotice("");
        setStep("verify");
        setCooldown(RESEND_SECONDS);
      } else if (signIn.error.code === "INVALID_EMAIL_OR_PASSWORD") {
        // Same message whether the password is wrong or the account only uses Google/GitHub (no enumeration)
        setError("Unable to sign in with email and password. Try Google or GitHub, or reset your password below.");
      } else {
        setError(signIn.error.message ?? "Something went wrong. Try again.");
      }
      return;
    }

    const signUp = await authClient.signUp.email({
      email: trimmed,
      password,
      name: trimmed.split("@")[0],
      callbackURL: dashboardUrl(),
    });
    setLoading(null);
    if (signUp.error) {
      setError(signUp.error.message ?? "Could not create your account. Try again.");
      return;
    }
    setNotice("");
    setStep("verify");
    setCooldown(RESEND_SECONDS);
  }

  async function resend() {
    setCooldown(RESEND_SECONDS);
    const { error } = await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: dashboardUrl() });
    setNotice(error ? (error.message ?? "Could not resend the email.") : "Verification email sent again.");
  }

  function back() {
    setStep("form");
    setPassword("");
    setNotice("");
    setError("");
  }

  if (step === "verify") {
    return (
      <div className="flex animate-in flex-col gap-5 fade-in slide-in-from-bottom-2 duration-300">
        <Button type="button" variant="ghost" size="sm" onClick={back} className="-ml-2 self-start text-ink-2">
          <ArrowLeft />
          Use a different email
        </Button>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <MailCheck className="size-7" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[28px] font-semibold leading-[1.15] tracking-tight">Check your inbox</h1>
          <p className="text-[15px] leading-normal text-ink-2">
            We sent a verification link to <b className="text-ink">{email.trim()}</b>. Click it to confirm your email and
            you’ll land on your dashboard. The link expires in 1 hour.
          </p>
          <p className="text-[13.5px] leading-normal text-ink-3">
            Already have an account? Go back and check your password.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="https://mail.google.com" target="_blank" rel="noreferrer" />}
          >
            Open Gmail
            <ArrowUpRight />
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href="https://outlook.live.com" target="_blank" rel="noreferrer" />}
          >
            Open Outlook
            <ArrowUpRight />
          </Button>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-[13.5px] text-muted-foreground">
          <span>Didn’t get it? Check spam, or</span>
          <Button type="button" variant="soft" size="sm" onClick={resend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend in 0:${String(cooldown).padStart(2, "0")}` : "Resend email"}
          </Button>
        </div>
        <p aria-live="polite" className="min-h-5 text-[13px] font-semibold text-primary">
          {notice}
        </p>
      </div>
    );
  }

  return (
    <div className="flex animate-in flex-col gap-6 fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[28px] font-semibold leading-[1.15] tracking-tight">
          {mode === "signin" ? "Sign in to Formlect" : "Create your account"}
        </h1>
        <p className="text-[15px] leading-normal text-ink-2">
          {mode === "signin" ? "Welcome back." : "Free to start. We’ll email you a link to confirm your address."}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <Button type="button" variant="outline" onClick={() => oauth("google")} disabled={loading !== null}>
          {loading === "google" ? <Loader2 className="animate-spin text-primary" /> : <GoogleIcon className="size-4.5" />}
          Continue with Google
        </Button>
        <Button type="button" variant="outline" onClick={() => oauth("github")} disabled={loading !== null}>
          {loading === "github" ? <Loader2 className="animate-spin text-primary" /> : <GithubIcon className="size-4.5" />}
          Continue with GitHub
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs font-bold tracking-[.06em] text-ink-3">
        <Separator className="flex-1" />
        OR
        <Separator className="flex-1" />
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.75">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@organisation.org"
              value={email}
              aria-invalid={!!error}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.75">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="At least 8 characters"
              value={password}
              aria-invalid={!!error}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="px-9"
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
          {mode === "signin" && (
            <Link href="/reset-password" className="self-end text-[13px] font-bold text-ink-2 hover:underline">
              Forgot your password?
            </Link>
          )}
          {error && (
            <Alert variant="destructive" className="animate-in fade-in">
              <CircleAlert />
              <AlertDescription className="font-semibold text-foreground">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <Button type="submit" size="lg" disabled={loading !== null}>
          {loading === "email" ? (
            <>
              <Loader2 className="animate-spin" />
              Checking
            </>
          ) : (
            mode === "signin" ? "Sign in" : "Create account"
          )}
        </Button>
        <p className="text-center text-[13.5px] font-normal text-ink-2">
          {mode === "signin" ? "New here? " : "Have an account? "}
          <Link
            href={mode === "signin" ? "/sign-up" : "/sign-in"}
            className="cursor-pointer font-bold text-primary hover:underline"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </form>
    </div>
  );
}
