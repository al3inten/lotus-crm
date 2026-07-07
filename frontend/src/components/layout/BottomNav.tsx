import { NavLink } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import clsx from "clsx";
import { useNavItems } from "./navConfig";

/**
 * Mobile-only bottom navigation bar. Shows the first 4 role-visible destinations
 * plus a "More" button that opens the full sidebar drawer for the rest.
 * Hidden at md+ where the persistent sidebar takes over.
 */
export function BottomNav({ onMore }: { onMore: () => void }) {
  const items = useNavItems();
  const primary = items.slice(0, 4);
  const hasMore = items.length > 4;

  const itemClass = "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium min-w-0";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-900/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {primary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                itemClass,
                "transition-colors",
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-blue-50 dark:bg-blue-500/10"
                  )}
                >
                  <item.icon size={20} />
                </span>
                <span className="max-w-full truncate">{item.short ?? item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={onMore}
            className={clsx(itemClass, "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white")}
          >
            <span className="flex h-8 w-14 items-center justify-center rounded-full">
              <MoreHorizontal size={20} />
            </span>
            <span>More</span>
          </button>
        )}
      </div>
    </nav>
  );
}
