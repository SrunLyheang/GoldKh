import { redirect } from "next/navigation";

// "/" is auth-protected by proxy.ts but has no content of its own — the
// dashboard is where a signed-in user lands (project-overview.md's Core
// User Flow, step 2).
export default function Home() {
  redirect("/dashboard");
}
