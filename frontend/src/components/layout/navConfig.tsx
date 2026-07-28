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
  CalendarCheck2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { ModuleKey } from "../../types";

type IconType = ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>;

/** Sidebar sections, in display order. */
export const NAV_GROUP_ORDER = ["WORKSPACE", "SALES", "ENGAGE", "INSIGHTS", "AUTOMATION", "ADMIN"] as const;
export type NavGroup = (typeof NAV_GROUP_ORDER)[number];

/** "ENGAGE" is under development — hidden from the sidebar for now. Remove it here to restore. */
const HIDDEN_GROUPS: NavGroup[] = ["ENGAGE"];

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
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", short: "Home", icon: Gauge, module: "dashboard", group: "WORKSPACE" },

  { to: "/leads", label: "Leads", icon: Car, module: "leads", group: "SALES" },
  { to: "/follow-ups", label: "Follow-ups", short: "Follows", icon: CalendarClock, module: "follow-ups", group: "SALES" },
  { to: "/test-drives", label: "Test Drives", short: "Drives", icon: CalendarCheck2, module: "test-drives", group: "SALES" },
  { to: "/customers", label: "Customers", short: "People", icon: Contact, module: "customers", group: "SALES" },
  { to: "/vehicles", label: "Vehicles", icon: CarFront, module: "vehicles", group: "SALES" },

  { to: "/social-inbox", label: "Social Inbox", short: "Inbox", icon: Inbox, module: "social-inbox", group: "ENGAGE" },
  { to: "/call-campaigns", label: "Call Campaigns", short: "Calls", icon: PhoneCall, module: "call-campaigns", group: "ENGAGE" },
  { to: "/bulk-messages", label: "Bulk Messages", short: "Messages", icon: Megaphone, module: "bulk-messages", group: "ENGAGE" },
  { to: "/templates", label: "Templates", icon: FileText, module: "templates", group: "ENGAGE" },
  { to: "/media-library", label: "Media Library", short: "Media", icon: Clapperboard, module: "media-library", group: "ENGAGE" },

  { to: "/reports", label: "Reports", icon: BarChart3, module: "reports", group: "INSIGHTS" },
  { to: "/reports/vehicle-performance", label: "Vehicle Performance", short: "Vehicles", icon: CarFront, module: "reports", group: "INSIGHTS" },

  { to: "/ai-agents", label: "AI Agents", short: "Agents", icon: Bot, module: "ai-agents", group: "AUTOMATION" },

  { to: "/branches", label: "Branches", short: "Branches", icon: Building2, module: "branches", group: "ADMIN" },
  { to: "/integrations", label: "Integrations", short: "Apps", icon: Plug, module: "integrations", group: "ADMIN" },
];

/** Module keys belonging to a currently-hidden nav group (e.g. "ENGAGE" while it's under
 * development) — used to keep role-creation's Section Access list in sync with what's
 * actually reachable in the sidebar right now, instead of showing modules nobody can visit. */
export const VISIBLE_MODULE_KEYS = new Set(
  NAV_ITEMS.filter((item) => !HIDDEN_GROUPS.includes(item.group)).map((item) => item.module)
);

/** Visible nav items grouped into ordered sections (empty sections dropped). */
export function useNavGroups(): { group: NavGroup; label: string; items: NavItem[] }[] {
  const items = useNavItems();
  return NAV_GROUP_ORDER.filter((group) => !HIDDEN_GROUPS.includes(group)).map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: items.filter((i) => i.group === group),
  })).filter((section) => section.items.length > 0);
}

/**
 * Nav items visible to the current user. SUPER_ADMIN sees everything; STAFF users see a
 * section only if their role's permission map grants "read" or "write" access to it.
 */
export function useNavItems(): NavItem[] {
  const { user } = useAuth();
  return NAV_ITEMS.filter((item) => {
    if (HIDDEN_GROUPS.includes(item.group)) return false;
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    const level = user.permissions?.[item.module];
    return level === "read" || level === "write";
  });
}
