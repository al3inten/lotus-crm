import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../types";

interface NavItem {
  to: string;
  label: string;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard" },
  { to: "/leads", label: "Leads" },
  {
    to: "/social-inbox",
    label: "Social Inbox",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/departments", label: "Departments", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/reports", label: "Reports", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/ai-agents", label: "AI Agents", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/media-library", label: "Media Library", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/templates", label: "Templates", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  {
    to: "/call-campaigns",
    label: "Call Campaigns",
    roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "CR_TEAM"],
  },
  { to: "/bulk-messages", label: "Bulk Messages", roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] },
  { to: "/integrations", label: "Integrations", roles: ["SUPER_ADMIN", "ADMIN"] },
];

export function Sidebar() {
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-5 text-lg font-semibold text-gray-900">Lotus CRM</div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              clsx(
                "rounded-md px-3 py-2 text-sm font-medium",
                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
