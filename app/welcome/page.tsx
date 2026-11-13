import { permanentRedirect } from "next/navigation";

// Old canonical URL for the landing page; it now lives only at "/".
export default function WelcomePage() {
  permanentRedirect("/");
}
