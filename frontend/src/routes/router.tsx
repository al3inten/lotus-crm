import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
// Public entry pages stay eager — they're the very first paint, so lazy-loading them
// would only add a loading flash with no bundle benefit worth having.
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";

// Everything behind auth is code-split: each page ships as its own chunk that loads only
// when the route is visited. This keeps the initial bundle small (fixes the >500 kB
// warning) so the app becomes interactive fast instead of parsing every screen up front.
// Pages use named exports, so map each to a default module for React.lazy.
const named = <T extends string>(name: T) => (mod: Record<T, ComponentType>) => ({ default: mod[name] });

const QuoteViewPage = lazy(() => import("../pages/QuoteViewPage").then(named("QuoteViewPage")));
const DashboardPage = lazy(() => import("../pages/DashboardPage").then(named("DashboardPage")));
const LeadsPage = lazy(() => import("../pages/LeadsPage").then(named("LeadsPage")));
const LeadDetailPage = lazy(() => import("../pages/LeadDetailPage").then(named("LeadDetailPage")));
const CustomersPage = lazy(() => import("../pages/CustomersPage").then(named("CustomersPage")));
const FollowUpsPage = lazy(() => import("../pages/FollowUpsPage").then(named("FollowUpsPage")));
const TestDrivesPage = lazy(() => import("../pages/TestDrivesPage").then(named("TestDrivesPage")));
const BranchesPage = lazy(() => import("../pages/BranchesPage").then(named("BranchesPage")));
const ReportsPage = lazy(() => import("../pages/ReportsPage").then(named("ReportsPage")));
const VehiclePerformancePage = lazy(() => import("../pages/VehiclePerformancePage").then(named("VehiclePerformancePage")));
const IntegrationsPage = lazy(() => import("../pages/IntegrationsPage").then(named("IntegrationsPage")));
const SocialInboxPage = lazy(() => import("../pages/SocialInboxPage").then(named("SocialInboxPage")));
const AiAgentsPage = lazy(() => import("../pages/AiAgentsPage").then(named("AiAgentsPage")));
const MediaLibraryPage = lazy(() => import("../pages/MediaLibraryPage").then(named("MediaLibraryPage")));
const TemplatesPage = lazy(() => import("../pages/TemplatesPage").then(named("TemplatesPage")));
const CallCampaignsPage = lazy(() => import("../pages/CallCampaignsPage").then(named("CallCampaignsPage")));
const BulkMessagesPage = lazy(() => import("../pages/BulkMessagesPage").then(named("BulkMessagesPage")));
const VehiclesPage = lazy(() => import("../pages/VehiclesPage").then(named("VehiclesPage")));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then(named("SettingsPage")));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-primary-600 dark:border-slate-700 dark:border-t-primary-500" />
    </div>
  );
}

// Wraps a lazy page in a Suspense boundary so its chunk can stream in with a spinner.
const suspense = (element: React.ReactNode) => <Suspense fallback={<PageFallback />}>{element}</Suspense>;

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/quote/:id", element: suspense(<QuoteViewPage />) },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: suspense(<DashboardPage />) },
          { path: "/leads", element: suspense(<LeadsPage />) },
          {
            element: <ProtectedRoute module="customers" />,
            children: [{ path: "/customers", element: suspense(<CustomersPage />) }],
          },
          { path: "/follow-ups", element: suspense(<FollowUpsPage />) },
          { path: "/test-drives", element: suspense(<TestDrivesPage />) },
          { path: "/leads/:leadId", element: suspense(<LeadDetailPage />) },
          { path: "/leads/:leadId/enquiries/:enquiryId", element: suspense(<LeadDetailPage />) },
          { path: "/vehicles", element: suspense(<VehiclesPage />) },
          {
            element: <ProtectedRoute module="social-inbox" />,
            children: [{ path: "/social-inbox", element: suspense(<SocialInboxPage />) }],
          },
          {
            element: <ProtectedRoute module="call-campaigns" />,
            children: [{ path: "/call-campaigns", element: suspense(<CallCampaignsPage />) }],
          },
          {
            element: <ProtectedRoute module="branches" />,
            children: [
              { path: "/branches", element: suspense(<BranchesPage />) },
              // Old URL kept so existing bookmarks/links don't 404.
              { path: "/departments", element: <Navigate to="/branches" replace /> },
            ],
          },
          {
            element: <ProtectedRoute module="reports" />,
            children: [
              { path: "/reports", element: suspense(<ReportsPage />) },
              { path: "/reports/vehicle-performance", element: suspense(<VehiclePerformancePage />) },
            ],
          },
          {
            element: <ProtectedRoute module="media-library" />,
            children: [{ path: "/media-library", element: suspense(<MediaLibraryPage />) }],
          },
          {
            element: <ProtectedRoute module="templates" />,
            children: [{ path: "/templates", element: suspense(<TemplatesPage />) }],
          },
          {
            element: <ProtectedRoute module="bulk-messages" />,
            children: [{ path: "/bulk-messages", element: suspense(<BulkMessagesPage />) }],
          },
          {
            element: <ProtectedRoute module="integrations" />,
            children: [{ path: "/integrations", element: suspense(<IntegrationsPage />) }],
          },
          {
            element: <ProtectedRoute module="ai-agents" />,
            children: [{ path: "/ai-agents", element: suspense(<AiAgentsPage />) }],
          },
          {
            element: <ProtectedRoute requireSuperAdmin />,
            children: [{ path: "/settings", element: suspense(<SettingsPage />) }],
          },
        ],
      },
    ],
  },
]);
