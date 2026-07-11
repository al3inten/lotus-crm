import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { QuoteViewPage } from "../pages/QuoteViewPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LeadsPage } from "../pages/LeadsPage";
import { LeadDetailPage } from "../pages/LeadDetailPage";
import { CustomersPage } from "../pages/CustomersPage";
import { DepartmentsPage } from "../pages/DepartmentsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { IntegrationsPage } from "../pages/IntegrationsPage";
import { SocialInboxPage } from "../pages/SocialInboxPage";
import { AiAgentsPage } from "../pages/AiAgentsPage";
import { MediaLibraryPage } from "../pages/MediaLibraryPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { CallCampaignsPage } from "../pages/CallCampaignsPage";
import { BulkMessagesPage } from "../pages/BulkMessagesPage";
import { VehiclesPage } from "../pages/VehiclesPage";
import { SettingsPage } from "../pages/SettingsPage";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/quote/:id", element: <QuoteViewPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/leads", element: <LeadsPage /> },
          { path: "/customers", element: <CustomersPage /> },
          { path: "/leads/:leadId", element: <LeadDetailPage /> },
          { path: "/leads/:leadId/enquiries/:enquiryId", element: <LeadDetailPage /> },
          { path: "/vehicles", element: <VehiclesPage /> },
          {
            element: <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"]} />,
            children: [
              { path: "/social-inbox", element: <SocialInboxPage /> },
              { path: "/call-campaigns", element: <CallCampaignsPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"]} />,
            children: [
              { path: "/departments", element: <DepartmentsPage /> },
              { path: "/reports", element: <ReportsPage /> },
              { path: "/media-library", element: <MediaLibraryPage /> },
              { path: "/templates", element: <TemplatesPage /> },
              { path: "/bulk-messages", element: <BulkMessagesPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={["SUPER_ADMIN", "ADMIN"]} />,
            children: [
              { path: "/integrations", element: <IntegrationsPage /> },
              { path: "/ai-agents", element: <AiAgentsPage /> },
              { path: "/settings", element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
