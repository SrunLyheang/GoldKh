import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { authAppearance } from "@/components/auth/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthShell
      heading="Create your account"
      subheading="Start tracking your gold in minutes"
    >
      <SignUp appearance={authAppearance} />
    </AuthShell>
  );
}
