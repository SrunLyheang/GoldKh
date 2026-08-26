import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-8">
      <Image src="/logo.svg" alt="GoldKh" width={165} height={42} priority />
      <SignIn />
    </div>
  );
}
