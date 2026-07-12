import type { ComponentType } from "react";
import {
  Gauge,
  Car,
  CalendarClock,
  Contact,
  Inbox,
  Building2,
  BarChart3,
  Bot,
  Clapperboard,
  FileText,
  PhoneCall,
  Megaphone,
  Plug,
  CarFront,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Role, ModuleKey } from "../../types";

type IconType = ComponentType<{ size?: number | string; className?: string }>;

/** Sidebar sections, in display order. */
export const NAV_GROUP_ORDER = ["WORKSPACE", "SALES", "ENGAGE", "INSIGHTS", "AUTOMATION", "ADMIN"] as const;
export type NavGroup = (typeof NAV_GROUP_ORDER)[number];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  WORKSPACE: "Workspace",
  SALES: "Sales",
  ENGAGE: "Engage",
  INSIGHTS: "Insights",
  AUTOMATION: "Automation",
  ADMIN: "Admin",
};

export interface NavItem {
  to: string;
  label: string;
  /** Shorter label for the mobile bottom bar; falls back to `label`. */
  short?: string;
  icon: IconType;
  module: ModuleKey;
  group: NavGroup;
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", short: "Home", icon: Gauge, module: "dashboard", group: "WORKSPACE" },

  { to: "/leads", label: "Leads", icon: Car, module: "leads", group: "SALES" },
  { to: "/follow-ups", label: "Follow-ups", short: "Follows", icon: CalendarClock, module: "follow-ups", group: "SALES" },
  { to: "/customers", label: "Customers", short: "People", icon: Contact, module: "leads", group: "SALES" },
  { to: "/vehicles", label: "Vehicles", icon: CarFront, module: "vehicles", group: "SALES" },

  {
    to: "/social-inbox",
    label: "Social Inbox",
    short: "Inbox",
    icon: Inbox,
    module: "social-inbox",
    group: "ENGAGE",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  {
    to: "/call-campaigns",
    label: "Call Campaigns",
    short: "Calls",
    icon: PhoneCall,
    module: "call-campaigns",
    group: "ENGAGE",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/bulk-messages", label: "Bulk Messages", short: "Messages", icon: Megaphone, module: "bulk-messages", group: "ENGAGE", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/templates", label: "Templates", icon: FileText, module: "templates", group: "ENGAGE", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/media-library", label: "Media Library", short: "Media", icon: Clapperboard, module: "media-library", group: "ENGAGE", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },

  { to: "/reports", label: "Reports", icon: BarChart3, module: "reports", group: "INSIGHTS", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },

  { to: "/ai-agents", label: "AI Agents", short: "Agents", icon: Bot, module: "ai-agents", group: "AUTOMATION", roles: ["SUPER_ADMIN", "ADMIN"] },

  { to: "/departments", label: "Departments", short: "Teams", icon: Building2, module: "departments", group: "ADMIN", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/integrations", label: "Integrations", short: "Apps", icon: Plug, module: "integrations", group: "ADMIN", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/settings", label: "Settings", short: "Settings", icon: Settings, module: "settings", group: "ADMIN", roles: ["SUPER_ADMIN", "ADMIN"] },
];

/** Visible nav items grouped into ordered sections (empty sections dropped). */
export function useNavGroups(): { group: NavGroup; label: string; items: NavItem[] }[] {
  const items = useNavItems();
  return NAV_GROUP_ORDER.map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: items.filter((i) => i.group === group),
  })).filter((section) => section.items.length > 0);
}

/**
 * Nav items visible to the current user. A custom role's permission toggles decide what
 * appears; users without a custom role fall back to base-role defaults. SUPER_ADMIN sees all.
 */
export function useNavItems(): NavItem[] {
  const { user } = useAuth();
  return NAV_ITEMS.filter((item) => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    if (user.permissions) return user.permissions.includes(item.module);
    return !item.roles || item.roles.includes(user.role);
  });
}
