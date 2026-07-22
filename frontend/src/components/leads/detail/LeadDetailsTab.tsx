import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  CalendarDays,
  MessagesSquare,
  Eye,
  PhoneCall,
  UserCircle2,
  Phone,
  Mail,
  MapPin,
  Car,
  Tag,
  Briefcase,
  CheckCircle2,
  Circle,
  Zap,
  Inbox,
  PhoneMissed,
  PlayCircle,
} from "lucide-react";

import { Card } from "../../../components/common/Card";
import { CopyButton } from "../../../components/common/CopyButton";
import { InfoField } from "./InfoField";
import { fadeUp } from "../../../lib/motion";
import type { LeadWithHistory, Enquiry } from "../../../types";
import type { CallLog } from "../../../api/voice.api";

interface LeadDetailsTabProps {
  lead: LeadWithHistory;
  enquiry: Enquiry;
  callLogs?: CallLog[];
  followUpUrgency: "overdue" | "today" | "future" | null;
  keyDates: { label: string; value: Date | null }[];
  setShowContactHistoryModal: (v: boolean) => void;
  setShowCallHistoryModal: (v: boolean) => void;
}

const BASE_SUB_TABS = ["info", "dates", "contact"] as const;
type SubTab = (typeof BASE_SUB_TABS)[number] | "calls";

const SUB_TAB_ICONS: Record<SubTab, typeof CalendarDays> = {
  info: UserCircle2,
  dates: CalendarDays,
  contact: MessagesSquare,
  calls: PhoneCall,
};

/** Every tab pane is this exact height — a header row plus a scrollable body — so
 * switching tabs never resizes the card, matching the Activity card's sub-tabs. */
const PANEL_HEIGHT = "h-[380px]";

function EmptyState({ icon: Icon, label }: { icon: typeof Inbox; label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
      <Icon size={24} className="mb-2 opacity-20" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function LeadDetailsTab({
  lead,
  enquiry,
  callLogs,
  followUpUrgency,
  keyDates,
  setShowContactHistoryModal,
  setShowCallHistoryModal,
}: LeadDetailsTabProps) {
  const hasCalls = !!callLogs && callLogs.length > 0;
  const tabs: SubTab[] = [...BASE_SUB_TABS, ...(hasCalls ? (["calls"] as const) : [])];
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("info");

  const tabLabels: Record<SubTab, string> = {
    info: "Customer Info",
    dates: "Key Dates",
    contact: `Contact History${lead.touches.length ? ` (${lead.touches.length})` : ""}`,
    calls: `AI Call History${callLogs?.length ? ` (${callLogs.length})` : ""}`,
  };

  return (
    <motion.div variants={fadeUp}>
      <Card padded={false} glow={false} className="overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-3 pt-3 [scrollbar-width:thin] dark:border-slate-800/60">
          {tabs.map((tab) => {
            const Icon = SUB_TAB_ICONS[tab];
            const active = activeSubTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSubTab(tab)}
                className={clsx(
                  "relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3.5 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500",
                  active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="detailsSubTab"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-indigo-500"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon size={13} strokeWidth={1.75} />
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeSubTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {/* ---------- CUSTOMER INFO ---------- */}
              {activeSubTab === "info" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/20">
                        <InfoField
                          icon={<Phone size={13} />}
                          label="Mobile Number"
                          value={
                            <span className="inline-flex items-center gap-1.5">
                              {lead.phoneRaw}
                              <CopyButton value={lead.phoneRaw} label="Copy phone number" />
                            </span>
                          }
                        />
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/20">
                        <InfoField
                          icon={<Mail size={13} />}
                          label="Email"
                          value={
                            <span className="inline-flex items-center gap-1.5">
                              {lead.email || "—"}
                              {lead.email && <CopyButton value={lead.email} label="Copy email" />}
                            </span>
                          }
                        />
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:col-span-2 dark:border-slate-800/60 dark:bg-slate-900/20">
                        <InfoField
                          icon={<MapPin size={13} />}
                          label="Address"
                          value={lead.address ? `${lead.address}${lead.pincode ? `, ${lead.pincode}` : ""}` : "—"}
                        />
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/20">
                        <InfoField icon={<Car size={13} />} label="Interested Vehicle" value={enquiry.carModel} />
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800/60 dark:bg-slate-900/20">
                        <InfoField icon={<Tag size={13} />} label="Customer Category" value={enquiry.enquiryCategory || "—"} />
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:col-span-2 dark:border-slate-800/60 dark:bg-slate-900/20">
                        <InfoField icon={<Briefcase size={13} />} label="Profession" value={lead.profession || "—"} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------- KEY DATES ---------- */}
              {activeSubTab === "dates" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    <div className="flex flex-col gap-2">
                      {keyDates.map((d) => (
                        <div
                          key={d.label}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 dark:border-slate-800/60 dark:bg-slate-900/20"
                        >
                          <span
                            className={clsx(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              d.value
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                            )}
                          >
                            {d.value ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                          </span>
                          <span className="flex-1 text-[13px] font-medium text-slate-600 dark:text-slate-300">{d.label}</span>
                          <span
                            className={clsx(
                              "text-[13px] font-semibold tabular-nums",
                              d.value ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500"
                            )}
                          >
                            {d.value ? d.value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Not set"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className={clsx(
                      "-mx-5 -mb-5 mt-3 flex items-center gap-2.5 px-5 py-3.5",
                      followUpUrgency === "overdue"
                        ? "bg-red-50/70 dark:bg-red-500/10"
                        : followUpUrgency === "today"
                          ? "bg-amber-50/70 dark:bg-amber-500/10"
                          : "bg-blue-50/70 dark:bg-blue-500/10"
                    )}
                  >
                    <Zap
                      size={14}
                      strokeWidth={1.75}
                      className={clsx(
                        "shrink-0",
                        followUpUrgency === "overdue"
                          ? "text-red-500 dark:text-red-400"
                          : followUpUrgency === "today"
                            ? "text-amber-500 dark:text-amber-400"
                            : "text-blue-500 dark:text-blue-400"
                      )}
                    />
                    <span
                      className={clsx(
                        "flex-1 text-[13px] font-medium",
                        followUpUrgency === "overdue"
                          ? "text-red-900 dark:text-red-200"
                          : followUpUrgency === "today"
                            ? "text-amber-900 dark:text-amber-200"
                            : "text-blue-900 dark:text-blue-200"
                      )}
                    >
                      Next Follow-up
                    </span>
                    <span
                      className={clsx(
                        "text-[13px] font-bold tabular-nums",
                        followUpUrgency === "overdue"
                          ? "text-red-700 dark:text-red-300"
                          : followUpUrgency === "today"
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-blue-700 dark:text-blue-300"
                      )}
                    >
                      {enquiry.followUpDueAt ? new Date(enquiry.followUpDueAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              )}

              {/* ---------- CONTACT HISTORY ---------- */}
              {activeSubTab === "contact" && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Every way they've reached us</p>
                    {lead.touches.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowContactHistoryModal(true)}
                        aria-label="View all contact history"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {(lead.touches.length > 0 || Object.keys(lead.touchesBySource).length > 0) ? (
                      <>
                        {(Object.keys(lead.touchesBySource).length > 0 || Object.keys(lead.messagesByChannel).length > 0) && (
                          <div className="mb-3 flex flex-wrap gap-1.5">
                            {Object.entries(lead.touchesBySource).map(([source, count]) => (
                              <span
                                key={source}
                                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                              >
                                {source.replaceAll("_", " ")} ×{count}
                              </span>
                            ))}
                            {Object.entries(lead.messagesByChannel).map(([channel, count]) => (
                              <span
                                key={channel}
                                className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300"
                              >
                                {channel} msgs: {count}
                              </span>
                            ))}
                          </div>
                        )}
                        <ul className="flex flex-col gap-2">
                          {lead.touches.slice(0, 4).map((touch) => (
                            <li
                              key={touch.id}
                              className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 text-xs dark:border-slate-800/60 dark:bg-slate-900/20"
                            >
                              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                                <MessagesSquare size={13} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{touch.source.replaceAll("_", " ")}</span>
                                  <span className="shrink-0 text-slate-400 dark:text-slate-500">{new Date(touch.createdAt).toLocaleDateString()}</span>
                                </div>
                                {touch.note && <p className="mt-1 text-slate-500 dark:text-slate-400">{touch.note}</p>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <EmptyState icon={Inbox} label="No contact history yet" />
                    )}
                  </div>
                </div>
              )}

              {/* ---------- AI CALL HISTORY ---------- */}
              {activeSubTab === "calls" && hasCalls && (
                <div className={clsx(PANEL_HEIGHT, "flex flex-col")}>
                  <div className="mb-3 flex justify-end">
                    {callLogs!.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowCallHistoryModal(true)}
                        aria-label="View all call history"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    <ul className="flex flex-col gap-2">
                      {callLogs!.slice(0, 3).map((call) => {
                        const isMissed = /missed|no.answer|failed/i.test(call.status);
                        return (
                          <li
                            key={call.id}
                            className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 text-sm dark:border-slate-800/60 dark:bg-slate-900/20"
                          >
                            <span
                              className={clsx(
                                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                isMissed
                                  ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                              )}
                            >
                              {isMissed ? <PhoneMissed size={13} /> : <PhoneCall size={13} />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{call.status.replaceAll("_", " ")}</span>
                                <span className="shrink-0 text-slate-400 dark:text-slate-500">{new Date(call.createdAt).toLocaleString()}</span>
                              </div>
                              {call.recordingUrl && (
                                <div className="mt-1.5 flex items-center gap-1.5">
                                  <PlayCircle size={13} className="shrink-0 text-slate-400" />
                                  <audio controls src={call.recordingUrl} className="h-8 w-full" />
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
