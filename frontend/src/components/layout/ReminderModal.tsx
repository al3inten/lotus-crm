import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useReminders } from "../../hooks/useLeads";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { BellRing, CalendarDays } from "lucide-react";

export function ReminderModal() {
  const { data: reminders } = useReminders();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState<number>(0);

  const overdueReminders = reminders?.filter(r => {
    if (!r.followUpDueAt) return false;
    const due = new Date(r.followUpDueAt);
    const now = new Date();
    return due < now && due.toDateString() !== now.toDateString();
  }) ?? [];
  
  const todayReminders = reminders?.filter(r => {
    if (!r.followUpDueAt) return false;
    return new Date(r.followUpDueAt).toDateString() === new Date().toDateString();
  }) ?? [];
  
  const reminderCount = overdueReminders.length + todayReminders.length;

  useEffect(() => {
    // If there are reminders, and we haven't dismissed them recently, and we are not already looking at a lead page
    if (reminderCount > 0 && Date.now() > dismissedUntil && !location.pathname.startsWith("/leads/")) {
      setIsOpen(true);
    } else if (reminderCount === 0) {
      setIsOpen(false);
    }
  }, [reminderCount, dismissedUntil, location.pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    // Dismiss for 30 minutes
    setDismissedUntil(Date.now() + 30 * 60 * 1000);
  };

  const handleGoToLead = (leadId: string) => {
    setIsOpen(false);
    navigate(`/leads/${leadId}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 ring-8 ring-primary-50 dark:bg-primary-500/20 dark:ring-primary-500/10 mb-4">
          <BellRing className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">You have Pending Follow-ups!</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          You have <strong className="text-slate-800 dark:text-slate-200">{reminderCount}</strong> lead(s) that need your attention right now.
        </p>
      </div>

      <div className="mt-6 max-h-[40vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50">
          {overdueReminders.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900">
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold text-slate-900 dark:text-slate-200">{r.lead.name}</span>
                <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                  <CalendarDays size={10} /> Overdue
                </span>
              </div>
              <Button size="sm" onClick={() => handleGoToLead(r.leadId)}>View Lead</Button>
            </div>
          ))}
          {todayReminders.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900">
              <div className="flex flex-col items-start gap-1">
                <span className="font-semibold text-slate-900 dark:text-slate-200">{r.lead.name}</span>
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  <CalendarDays size={10} /> Due Today
                </span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleGoToLead(r.leadId)}>View Lead</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex w-full gap-3">
        <Button variant="secondary" className="flex-1 justify-center" onClick={handleDismiss}>
          Remind me later
        </Button>
      </div>
    </Modal>
  );
}
