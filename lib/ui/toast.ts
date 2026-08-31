import { toast } from "sonner";

// Thin wrapper over sonner so call sites don't repeat the duration and
// dedupe config. `id` is the message itself: mashing submit can't stack
// three identical error toasts — the second call just refreshes the first.
// Durations are deliberate: success is a quick confirmation, errors linger
// long enough to read and act on.
export const notify = {
  success(message: string): void {
    toast.success(message, { id: message, duration: 3000 });
  },
  error(message: string): void {
    toast.error(message, { id: message, duration: 6000 });
  },
  // Neutral notice — neither a success confirmation nor a failure. Used
  // for "here's why that control didn't do what you expected" messages.
  info(message: string): void {
    toast(message, { id: message, duration: 4500 });
  },
};
