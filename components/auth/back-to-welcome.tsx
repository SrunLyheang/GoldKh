import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Takes the visitor from the sign-in / sign-up screens back to the public
// landing page at "/". Dictionary is frozen this phase, so the label is
// inline English (same precedent as "View all →").
export function BackToWelcome() {
  return (
    <Link
      href="/"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-muted-foreground hover:text-foreground",
      )}
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Return to welcome page
    </Link>
  );
}
