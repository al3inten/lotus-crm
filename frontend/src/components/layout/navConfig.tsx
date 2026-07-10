import type { ComponentType } from "react";
import {
  Gauge,
  Car,
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

export interface NavItem {
  to: string;
  label: string;
  /** Shorter label for the mobile bottom bar; falls back to `label`. */
  short?: string;
  icon: IconType;
  module: ModuleKey;
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", short: "Home", icon: Gauge, module: "dashboard" },
  { to: "/leads", label: "Leads", icon: Car, module: "leads" },
  { to: "/vehicles", label: "Vehicles", icon: CarFront, module: "vehicles" },
  {
    to: "/social-inbox",
    label: "Social Inbox",
    short: "Inbox",
    icon: Inbox,
    module: "social-inbox",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/departments", label: "Departments", short: "Teams", icon: Building2, module: "departments", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/reports", label: "Reports", icon: BarChart3, module: "reports", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/ai-agents", label: "AI Agents", short: "Agents", icon: Bot, module: "ai-agents", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/media-library", label: "Media Library", short: "Media", icon: Clapperboard, module: "media-library", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/templates", label: "Templates", icon: FileText, module: "templates", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  {
    to: "/call-campaigns",
    label: "Call Campaigns",
    short: "Calls",
    icon: PhoneCall,
    module: "call-campaigns",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/bulk-messages", label: "Bulk Messages", short: "Messages", icon: Megaphone, module: "bulk-messages", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/integrations", label: "Integrations", short: "Apps", icon: Plug, module: "integrations", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/settings", label: "Settings", short: "Settings", icon: Settings, module: "settings", roles: ["SUPER_ADMIN", "ADMIN"] },
];

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
