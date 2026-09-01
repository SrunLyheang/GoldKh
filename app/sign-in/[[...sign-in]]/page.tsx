import { SignIn } from "@clerk/nextjs";

import { AuthShell } from "@/components/auth/auth-shell";
import { authAppearance } from "@/components/auth/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthShell heading="Welcome back!" subheading="Enter your login details">
      <SignIn appearance={authAppearance} />
    </AuthShell>
  );
}
