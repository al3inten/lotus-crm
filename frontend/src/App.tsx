import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes/router";
import { getErrorMessage, getSuccessMessage, notifyError, notifySuccess } from "./lib/apiToast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for a minute — repeat visits to a screen within that
      // window render instantly from cache instead of refiring a wall of API calls.
      staleTime: 60_000,
      // Keep unused data around for 5 min so navigating back to a page is instant.
      gcTime: 5 * 60_000,
      retry: 1,
      // Don't refetch every dashboard/report query just because the user tabbed away and
      // back — that was hammering the API on every window focus.
      refetchOnWindowFocus: false,
    },
  },
  // Background reads failing is still worth surfacing — the screen may be silently stale.
  queryCache: new QueryCache({
    onError: (error) => notifyError(getErrorMessage(error)),
  }),
  // Every mutation is a user-initiated write (save/delete/update/etc.) so every one gets a
  // toast — meta.successMessage (set per useMutation call) gives the specific human-readable
  // success text. Error text is never hardcoded per-hook: it's always the backend's own
  // message, so it can't drift from what the server actually rejected the request for.
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      notifySuccess(getSuccessMessage(mutation.meta));
    },
    onError: (error) => {
      notifyError(getErrorMessage(error));
    },
  }),
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster richColors position="top-right" closeButton />
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
