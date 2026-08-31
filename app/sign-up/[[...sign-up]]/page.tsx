import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { BackToWelcome } from "@/components/auth/back-to-welcome";
import { authAppearance } from "@/components/auth/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
      heading="Create your account"
      subheading="Start tracking your gold in minutes"
    >
      <SignUp appearance={authAppearance} />
      <div className="mt-6 flex justify-center">
        <BackToWelcome />
      </div>
    </AuthShell>
  );
}
