import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

import { AuthAuroraBackground } from "@/components/auth/auth-aurora-background";
import { BackToWelcome } from "@/components/auth/back-to-welcome";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-8">
      <AuthAuroraBackground />
      <Image src="/logo.svg" alt="GoldKh" width={165} height={42} priority />
      <SignIn />
      <BackToWelcome />
    </div>
  );
}
