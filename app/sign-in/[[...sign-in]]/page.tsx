import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { BackToWelcome } from "@/components/auth/back-to-welcome";
import { authAppearance } from "@/components/auth/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell heading="Welcome back!" subheading="Enter your login details">
      <SignIn appearance={authAppearance} />
      <div className="mt-6 flex justify-center">
        <BackToWelcome />
      </div>
    </AuthShell>
  );
}
