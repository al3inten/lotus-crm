import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { ReminderModal } from "./ReminderModal";
import { useHeartbeat } from "../../hooks/useHeartbeat";

export function AppShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  useHeartbeat();

  // Automatically scroll to the top of the main content area when navigating between pages
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#0a0a0a] transition-colors selection:bg-blue-500/30 font-sans">
      
      {/* Precision Glow (Subtle, professional background depth) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-[100%] bg-blue-500/5 blur-[120px] dark:bg-blue-500/10 mix-blend-screen" />
      </div>

      <div className="z-10 flex h-full w-full">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Topbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          
          <main ref={mainRef} className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pb-24 md:p-8 lg:px-12 xl:px-16">
            <Outlet />
          </main>
        </div>
        
        <BottomNav onMore={() => setIsMobileMenuOpen(true)} />
      </div>
      
      <ReminderModal />
    </div>
  );
}
