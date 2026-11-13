import { cookies } from "next/headers";
import { DEVICE_COOKIE, isValidDeviceId } from "./device";

// The caller's device id, read from the httpOnly cookie proxy.ts sets.
// Server components, route handlers and server actions only — the id is
// never accepted from a request body or query string.
export async function getDeviceId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(DEVICE_COOKIE)?.value;
  return isValidDeviceId(value) ? value : null;
}
