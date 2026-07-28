import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  ArrowLeft,
  Eye,
  Phone,
  MessageCircle,
  Zap,
  Pencil,
  UserPlus,
  ClipboardEdit,
  Radio,
  Building2,
  Mail,
  Car,
  UserCircle2,
  Check,
  X,
  Briefcase,
  MapPin,
  Flame,
  Thermometer,
  Snowflake,
  CalendarClock,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

import { Avatar } from "../../../components/common/Avatar";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { CopyButton } from "../../../components/common/CopyButton";
import { Button } from "../../../components/common/Button";
import { Select } from "../../../components/common/Input";

import { InfoField } from "./InfoField";
import { ActionButton } from "./ActionButton";

import { fadeUp } from "../../../lib/motion";
import type { LeadWithHistory, Enquiry, User, ConsultantDirectory } from "../../../types";
import { daysBetween } from "./leadUtils";

/* ────────────────────────────────────────────────────────────────────────────
   "Record Header" — the proven CRM pattern (Attio / HubSpot / Salesforce),
   executed cleanly. One white card, soft shadow, clear left-to-right story:
   identity → state → actions. A labeled key-info row sits underneath on a
   tinted band. Familiar, balanced, professional — nothing experimental.
──────────────────────────────────────────────────────────────────────────── */

const CATEGORY_STYLE: Record<string, { icon: ReactNode; className: string }> = {
  HOT: {
    icon: <Flame size={12} />,
    className: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400",
  },
  WARM: {
    icon: <Thermometer size={12} />,
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400",
  },
  COLD: {
    icon: <Snowflake size={12} />,
    className: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400",
  },
};

function Tag({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        className ??
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
      )}
    >
      {icon && <span className="opacity-70">{icon}</span>}
      {children}
    </span>
  );
}

interface LeadHeroHeaderProps {
  lead: LeadWithHistory;
  enquiry?: Enquiry;
  crTeam?: User[];
  consultants?: ConsultantDirectory[];
  canReassign: boolean;
  /** False when a CR_TEAM user is viewing a lead not assigned to them — view-only. */
  canAct: boolean;
  completeDetailsNeeded: boolean;
  setShowCustomerView: (v: boolean) => void;
  openFollowUp: () => void;
  setShowDetailsWizard: (v: boolean) => void;
  onReassign: (crId: string) => void;
  onUpdateConsultant: (consultantId: string) => void;
  isUpdatingDetails: boolean;
}

export function LeadHeroHeader({
  lead,
  enquiry,
  crTeam,
  consultants,
  canReassign,
  canAct,
  completeDetailsNeeded,
  setShowCustomerView,
  openFollowUp,
  setShowDetailsWizard,
  onReassign,
  onUpdateConsultant,
  isUpdatingDetails,
}: LeadHeroHeaderProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignTo, setReassignTo] = useState("");
  const [consultantEdit, setConsultantEdit] = useState(false);
  const [consultantValue, setConsultantValue] = useState("");
  const assignRef = useRef<HTMLDivElement>(null);

  const phoneDigits = lead.phoneRaw?.replace(/\D/g, "") ?? "";
  const category = enquiry?.enquiryCategory ? CATEGORY_STYLE[enquiry.enquiryCategory] : undefined;
  const ageDays = enquiry ? daysBetween(new Date(), new Date(enquiry.createdAt)) : null;

  useEffect(() => {
    if (!assignOpen) return;
    const onDown = (e: MouseEvent) => {
      if (assignRef.current && !assignRef.current.contains(e.target as Node)) setAssignOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAssignOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [assignOpen]);

  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-3">
      {/* ── Breadcrumb row (outside the card, like Attio) ── */}
      <div className="flex items-center justify-between px-1">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            to="/leads"
            className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 -ml-1.5 font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <ArrowLeft size={15} />
            Leads
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="truncate font-medium text-slate-900 dark:text-white">{lead.name}</span>
        </nav>
        {ageDays !== null && (
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 sm:flex">
            <CalendarClock size={13} />
            {ageDays <= 0 ? "Enquired today" : `${ageDays} days in pipeline`}
          </span>
        )}
      </div>

      {/* ── Record card ── */}
      <div className="overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Identity + actions */}
        <div className="flex flex-col gap-3.5 p-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={lead.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                  {lead.name}
                </h1>
                {enquiry && <StatusBadge status={enquiry.status} lossReason={enquiry.lossReason} />}
                {category && (
                  <Tag icon={category.icon} className={category.className}>
                    {enquiry?.enquiryCategory}
                  </Tag>
                )}
              </div>
              {enquiry?.referrerName && (
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  Referred by: <span className="font-medium text-slate-700 dark:text-slate-300">{enquiry.referrerName}</span>
                </p>
              )}
              {enquiry && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {/* The editable classification (Lead Source/Subsource from Edit) — not
                      enquiry.source, which is the fixed intake channel set at creation and
                      never changes here. Falls back to the intake channel until classified. */}
                  <Tag icon={<Radio size={12} />}>
                    {enquiry.sourceCategory
                      ? `${enquiry.sourceCategory.replaceAll("_", " ")}${
                          enquiry.subsource ? ` · ${enquiry.subsource.replaceAll("_", " ")}` : ""
                        }`
                      : enquiry.source.replaceAll("_", " ")}
                  </Tag>
                  <Tag icon={<Building2 size={12} />}>{enquiry.branch.name}</Tag>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/60 p-1 dark:border-slate-800/60 dark:bg-slate-800/30 lg:shrink-0 lg:justify-end">
            <ActionButton icon={<Phone size={16} />} label="Call" href={`tel:${lead.phoneRaw}`} tone="call" disabled={!lead.phoneRaw} />
            <ActionButton
              icon={<MessageCircle size={16} />}
              label="WhatsApp"
              href={phoneDigits ? `https://wa.me/${phoneDigits}` : undefined}
              external
              tone="whatsapp"
              disabled={!phoneDigits}
            />
            <ActionButton
              icon={<Zap size={16} />}
              label="Follow-up"
              onClick={openFollowUp}
              tone="primary"
              disabled={!enquiry || enquiry.status === "CLOSED" || !canAct}
            />
            <ActionButton icon={<Pencil size={16} />} label="Edit" onClick={() => setShowDetailsWizard(true)} disabled={!enquiry || !canAct} />
            {enquiry && (
              <button
                type="button"
                onClick={() => setShowCustomerView(true)}
                title="Customer view"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 hover:shadow-md active:scale-95 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                <Eye size={16} />
              </button>
            )}
            {canReassign && (
              <div className="relative" ref={assignRef}>
                <button
                  type="button"
                  onClick={() => setAssignOpen((o) => !o)}
                  disabled={!enquiry}
                  className="flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-95 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <UserPlus size={15} />
                  <span className="hidden md:inline">Assign</span>
                  <ChevronDown size={14} className={clsx("text-slate-400 transition-transform", assignOpen && "rotate-180")} />
                </button>
                {assignOpen && enquiry && (
                  <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Reassign to CR</p>
                    <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} className="w-full text-sm">
                      <option value="">Select CR…</option>
                      {crTeam?.map((cr) => (
                        <option key={cr.id} value={cr.id}>
                          {cr.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      disabled={!reassignTo}
                      onClick={() => {
                        onReassign(reassignTo);
                        setReassignTo("");
                        setAssignOpen(false);
                      }}
                    >
                      Assign
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Read-only notice — CR_TEAM viewing a lead not assigned to them */}
        {!canAct && (
          <div className="flex items-center gap-2.5 border-t border-slate-200/70 bg-slate-50 px-4 py-2.5 sm:px-5 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              <UserCircle2 size={14} />
            </span>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              This lead isn't assigned to you — you can view it, but only the assigned CR can make changes.
            </p>
          </div>
        )}

        {/* Missing details banner */}
        {canAct && completeDetailsNeeded && (
          <div className="flex flex-col gap-2.5 border-t border-amber-200/70 bg-amber-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="flex items-center gap-2.5 text-sm font-medium text-amber-800 dark:text-amber-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <ClipboardEdit size={14} />
              </span>
              Some enquiry details are missing — complete them to improve routing.
            </p>
            <Button size="sm" icon={<ClipboardEdit size={13} />} onClick={() => setShowDetailsWizard(true)}>
              Complete details
            </Button>
          </div>
        )}

        {/* Key info band */}
        {enquiry && (
          <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/30 sm:px-5 rounded-b-xl">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/50 dark:bg-slate-900/40">
                <InfoField
                  icon={<Phone size={14} />}
                  label="Mobile"
                  value={
                    <span className="group flex items-center gap-2">
                      <span className="tabular-nums">{lead.phoneRaw}</span>
                      <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                        <a
                          href={`tel:${lead.phoneRaw}`}
                          title="Call"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-primary-600 transition-colors hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-800 dark:text-primary-400 dark:hover:bg-slate-700"
                        >
                          <Phone size={12} />
                        </a>
                        {phoneDigits && (
                          <a
                            href={`https://wa.me/${phoneDigits}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400 dark:hover:bg-slate-700"
                          >
                            <MessageCircle size={12} />
                          </a>
                        )}
                        <CopyButton value={lead.phoneRaw} label="Copy phone number" />
                      </span>
                    </span>
                  }
                />
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/50 dark:bg-slate-900/40">
                <InfoField
                  icon={<Mail size={14} />}
                  label="Email"
                  value={
                    <span className="group flex items-center gap-2">
                      <span className="truncate">{lead.email || "—"}</span>
                      {lead.email && (
                        <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                          <a
                            href={`mailto:${lead.email}`}
                            title="Send email"
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-primary-600 transition-colors hover:bg-primary-50 dark:border-slate-700 dark:bg-slate-800 dark:text-primary-400 dark:hover:bg-slate-700"
                          >
                            <Mail size={12} />
                          </a>
                          <CopyButton value={lead.email} label="Copy email" />
                        </span>
                      )}
                    </span>
                  }
                />
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/50 dark:bg-slate-900/40">
                <InfoField icon={<Car size={14} />} label="Vehicle" value={enquiry.carModel} />
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/50 dark:bg-slate-900/40">
                <InfoField
                  icon={<RefreshCw size={14} />}
                  label="Exchange"
                  value={
                    enquiry.exchangeCarModel
                      ? `${enquiry.exchangeCarModel}${enquiry.exchangeCarYear ? ` · ${enquiry.exchangeCarYear}` : ""}`
                      : "No exchange vehicle"
                  }
                />
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/50 dark:bg-slate-900/40">
                <InfoField icon={<UserCircle2 size={14} />} label="Sales CR" value={enquiry.assignedCr?.name ?? "Unassigned"} />
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white p-2.5 dark:border-slate-700/50 dark:bg-slate-900/40">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <UserCircle2 size={14} /> Consultant
                </p>
                {consultantEdit ? (
                  <div className="flex items-center gap-1.5">
                    <Select value={consultantValue} onChange={(e) => setConsultantValue(e.target.value)} className="w-full text-sm">
                      <option value="">Select…</option>
                      {consultants?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      aria-label="Save consultant"
                      disabled={!consultantValue || isUpdatingDetails}
                      onClick={() => {
                        onUpdateConsultant(consultantValue);
                        setConsultantEdit(false);
                      }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-600 text-white transition-colors hover:bg-primary-500 disabled:opacity-40"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancel"
                      onClick={() => setConsultantEdit(false)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {enquiry.consultant?.name ?? "—"}
                    </p>
                    {canReassign && (
                      <button
                        type="button"
                        onClick={() => {
                          setConsultantValue(enquiry.consultantId ?? "");
                          setConsultantEdit(true);
                        }}
                        className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Change
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {(lead.profession || enquiry.location) && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-3 dark:border-slate-700/50">
                {lead.profession && <Tag icon={<Briefcase size={12} />}>{lead.profession}</Tag>}
                {enquiry.location && <Tag icon={<MapPin size={12} />}>{enquiry.location}</Tag>}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}