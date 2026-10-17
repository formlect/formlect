import type { Metadata } from "next";
import { Suspense } from "react";
import { Logo } from "@/components/auth/logo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset your password · Formlect" };

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col bg-canvas px-5 py-6 text-ink sm:px-8 sm:py-7">
      <Logo />
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-98">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
