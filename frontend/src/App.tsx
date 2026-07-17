import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes/router";

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
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
