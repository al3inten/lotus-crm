import { isAxiosError } from "axios";
import { toast } from "sonner";
import type { MutationMeta } from "@tanstack/react-query";

/** Set on individual useMutation() calls to give the global success toast a specific
 * message, e.g. `meta: { successMessage: "Lead saved" }`. There is deliberately no
 * per-hook error message — error text always comes from the backend's response so it
 * can't drift from what the server actually rejected the request for. */
export interface ApiToastMeta extends MutationMeta {
  successMessage?: string;
}

export function getSuccessMessage(meta: MutationMeta | undefined): string {
  return (meta as ApiToastMeta | undefined)?.successMessage ?? "Saved successfully";
}

/** Always the backend's own error message (see errorHandler.ts's { error, details } shape) —
 * the only fallbacks are for cases where there IS no backend response at all (network down,
 * a thrown client-side exception), where nothing else is available to show. */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Backend's errorHandler responds with { error: "..." } (see errorHandler.ts); Zod
    // validation failures instead send { error: "Validation failed", details: {...} }.
    const data = error.response?.data as { error?: string; details?: { fieldErrors?: Record<string, string[]> } } | undefined;
    const fieldError = Object.values(data?.details?.fieldErrors ?? {})[0]?.[0];
    const serverMessage = fieldError ?? data?.error;
    if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;
    if (error.code === "ERR_NETWORK") return "Network error — check your connection and try again";
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong";
}

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(message: string) {
  toast.error(message);
}
