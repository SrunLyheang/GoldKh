import { redirect } from "next/navigation";

// "/" has no content of its own — it just hands off to /dashboard, which
// protects itself (project-overview.md's Core User Flow, step 2).
export default function Home() {
  redirect("/dashboard");
}
