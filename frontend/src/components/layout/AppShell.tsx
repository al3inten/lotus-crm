import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        {/* pb-24 on mobile keeps content clear of the fixed bottom nav; reset at md+ */}
        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-24 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <BottomNav onMore={() => setIsMobileMenuOpen(true)} />
    </div>
  );
}
