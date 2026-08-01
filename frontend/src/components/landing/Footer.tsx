export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <img src="/lotus-group-hq.png" alt="Lotus Group of Companies" className="h-8 w-auto rounded-md object-contain" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Lotus D-CRM</span>
          <span className="text-sm text-slate-400 dark:text-slate-500">· Hyundai Dealership Suite</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Lotus D-CRM. Every lead, every call, one drive to close.
        </p>
      </div>
    </footer>
  );
}
