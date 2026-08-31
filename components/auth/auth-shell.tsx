import type { ReactNode } from "react";
import { UserRound } from "lucide-react";
import { SparkleField } from "@/components/effects/sparkle-field";
import { AuthMascot } from "./auth-mascot";

export function AuthShell({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* page background */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#0f0c08]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(58% 42% at 50% 8%, rgba(232,184,75,0.16), transparent 70%), radial-gradient(42% 32% at 88% 104%, rgba(232,184,75,0.10), transparent 72%)",
        }}
      />
      <SparkleField className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 grid w-full max-w-[980px] overflow-hidden rounded-[28px] border border-white/10 bg-background shadow-[0_40px_120px_-24px_rgba(0,0,0,0.7)] md:grid-cols-2">
        {/* brand panel */}
        <div className="relative hidden min-h-[560px] bg-white md:block">
          <AuthMascot />
        </div>

        {/* form panel — inherits the app's dark Clerk theme */}
        <div className="flex flex-col items-center bg-background px-6 py-10 text-foreground sm:px-12 sm:py-14">
          <span className="mb-6 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserRound className="size-6" />
          </span>
          <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="mt-1.5 mb-8 text-sm font-medium text-muted-foreground">
            {subheading}
          </p>
          <div className="w-full max-w-[360px]">{children}</div>
        </div>
      </div>
    </main>
  );
}
