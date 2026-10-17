import type { Metadata } from "next";
import { BrandPanel } from "@/components/auth/brand-panel";
import { Logo } from "@/components/auth/logo";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Create your account · Formlect" };

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-2">
      {/* Form column: grows with its content, so the page scrolls on short screens */}
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8 sm:py-7">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-98">
            <SignInForm mode="signup" />
          </div>
        </div>
        <footer className="text-[12.5px] leading-normal text-ink-3">
          By continuing you agree to the{" "}
          <a href="#" className="font-bold text-ink-2 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="font-bold text-ink-2 hover:underline">
            Privacy Policy
          </a>
          .
        </footer>
      </div>

      {/* Decorative panel: large screens only, stays pinned while the form column scrolls */}
      <aside className="sticky top-0 hidden h-screen p-4 lg:block">
        <BrandPanel />
      </aside>
    </main>
  );
}
