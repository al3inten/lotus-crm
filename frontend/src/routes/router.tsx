import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LeadsPage } from "../pages/LeadsPage";
import { LeadDetailPage } from "../pages/LeadDetailPage";
import { DepartmentsPage } from "../pages/DepartmentsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { IntegrationsPage } from "../pages/IntegrationsPage";
import { SocialInboxPage } from "../pages/SocialInboxPage";
import { AiAgentsPage } from "../pages/AiAgentsPage";
import { MediaLibraryPage } from "../pages/MediaLibraryPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { CallCampaignsPage } from "../pages/CallCampaignsPage";
import { BulkMessagesPage } from "../pages/BulkMessagesPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/leads", element: <LeadsPage /> },
          { path: "/leads/:leadId", element: <LeadDetailPage /> },
          { path: "/leads/:leadId/enquiries/:enquiryId", element: <LeadDetailPage /> },
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
            ],
          },
        ],
      },
    ],
  },
]);
