import { toast } from "sonner";

// Thin wrapper over sonner so call sites don't repeat the duration and
// dedupe config. `id` is the message itself: mashing submit can't stack
// three identical error toasts — the second call just refreshes the first.
// Durations follow the spec: success is a quick confirmation, errors linger
// long enough to read and act on.
// (context/design-specs/03-dashboard-animation-and-input-feedback.md)
export const notify = {
  success(message: string): void {
    toast.success(message, { id: message, duration: 3000 });
  },
  error(message: string): void {
    toast.error(message, { id: message, duration: 6000 });
  },
};
