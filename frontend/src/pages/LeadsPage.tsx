import { useState } from "react";
import { Car, ChevronLeft, ChevronRight, FileSpreadsheet, Users, Loader2, LayoutGrid, List, Plus, Upload } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { useLeads } from "../hooks/useLeads";
import type { LeadFilters as LeadFiltersType } from "../api/leads.api";
import { LeadFilters } from "../components/leads/LeadFilters";
import { LeadTable } from "../components/leads/LeadTable";
import { LeadKanbanBoard } from "../components/leads/LeadKanbanBoard";
import { AddLeadWizard } from "../components/leads/AddLeadWizard";
import { LeadDraftsButton } from "../components/leads/LeadDraftsButton";
import { ImportLeadsModal } from "../components/leads/ImportLeadsModal";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { GoogleSheetsSyncForm } from "../components/integrations/GoogleSheetsSyncForm";
import { useIntegrations } from "../hooks/useIntegrations";
import type { AddLeadFormValues } from "../schemas/lead.schema";
import type { LeadDraft } from "../types";

const PAGE_SIZE = 20;

const pageVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/** Compact page-number list with ellipses (1 … 4 5 6 … 20). */
function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
}

export function LeadsPage() {
  const [filters, setFilters] = useState<LeadFiltersType>({ page: 1, pageSize: PAGE_SIZE });
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSheetsSyncModal, setShowSheetsSyncModal] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<LeadDraft | undefined>(undefined);
  const [view, setView] = useState<"list" | "kanban">("list");

  const { data, isLoading, isFetching } = useLeads(filters);
  const { data: integrations } = useIntegrations();
  const googleSheetsConnected = integrations?.find((i) => i.key === "GOOGLE_SHEETS")?.hasCredentials ?? false;

  const page = data?.page ?? 1;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const goToPage = (p: number) => setFilters((f) => ({ ...f, page: Math.min(Math.max(1, p), totalPages) }));

  const ViewToggle = (
    <div className="flex items-center rounded-xl bg-white/10 p-1 ring-1 ring-white/20 backdrop-blur-md">
      {(["list", "kanban"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setView(v)}
          aria-pressed={view === v}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
            view === v ? "bg-white text-blue-600 shadow-sm" : "text-slate-200 hover:text-white"
          )}
        >
          {v === "list" ? <List size={16} /> : <LayoutGrid size={16} />}
          {v === "list" ? "List" : "Kanban"}
        </button>
      ))}
    </div>
  );

  return (
    <motion.div initial="hidden" animate="visible" variants={pageVariants} className="flex flex-col gap-5">
      {/* ---------- HERO HEADER ---------- */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-xl dark:bg-slate-950 sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[60%] h-[220%] w-[45%] rounded-full bg-blue-600/25 blur-[110px] dark:bg-blue-600/12" />
          <div className="absolute -right-[15%] top-[-30%] h-[170%] w-[55%] rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-500/10" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-md">
              <Car size={26} />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Leads</h1>
              <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                <Users size={15} className="text-blue-400" />
                {isLoading ? (
                  <span className="inline-block h-4 w-28 animate-pulse rounded bg-white/15" />
                ) : (
                  <>
                    <span className="font-bold text-white tabular-nums">{total.toLocaleString()}</span>
                    {total === 1 ? "lead" : "leads"} across your showrooms
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {ViewToggle}
            {googleSheetsConnected && (
              <Button variant="secondary" icon={<FileSpreadsheet size={14} />} onClick={() => setShowSheetsSyncModal(true)}>
                Sync
              </Button>
            )}
            <Button variant="secondary" icon={<Upload size={14} />} onClick={() => setShowImportModal(true)}>
              Import
            </Button>
            <LeadDraftsButton
              onResume={(draft) => {
                setResumeDraft(draft);
                setShowAddLeadForm(true);
              }}
            />
            <Button
              icon={<Plus size={16} />}
              onClick={() => {
                setResumeDraft(undefined);
                setShowAddLeadForm(true);
              }}
            >
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- FILTERS ---------- */}
      <Card>
        <LeadFilters filters={filters} onChange={setFilters} />
      </Card>

      {/* ---------- RESULT SUMMARY BAR ---------- */}
      {!isLoading && data && (
        <div className="flex items-center justify-between gap-3 px-1 text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            {total === 0 ? (
              "No leads match your filters"
            ) : (
              <>
                Showing <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">{from}–{to}</span> of{" "}
                <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">{total.toLocaleString()}</span>
              </>
            )}
          </p>
          {isFetching && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Loader2 size={13} className="animate-spin" />
              Updating…
            </span>
          )}
        </div>
      )}

      {/* ---------- CONTENT ---------- */}
      {isLoading || !data ? (
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-800" style={{ animationDelay: `${i * 60}ms` }} />
                <div className="hidden h-4 w-24 animate-pulse rounded bg-slate-200 sm:block dark:bg-slate-800" />
                <div className="hidden h-6 w-20 animate-pulse rounded-full bg-slate-200 md:block dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className={clsx("transition-opacity duration-200", isFetching && "pointer-events-none opacity-60")}>
          {view === "kanban" ? (
            <LeadKanbanBoard enquiries={data.items} />
          ) : (
            <Card padded={false} className="overflow-hidden">
              <LeadTable enquiries={data.items} />

              {/* Numbered pagination */}
              {total > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <nav aria-label="Pagination" className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={page <= 1}
                      onClick={() => goToPage(page - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {getPageNumbers(page, totalPages).map((p, i) =>
                      p === "ellipsis" ? (
                        <span key={`e${i}`} className="px-1.5 text-slate-400 dark:text-slate-600">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          aria-label={`Page ${p}`}
                          aria-current={p === page}
                          onClick={() => goToPage(p)}
                          className={clsx(
                            "flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                            p === page
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          )}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={page >= totalPages}
                      onClick={() => goToPage(page + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      <AddLeadWizard
        isOpen={showAddLeadForm}
        onClose={() => setShowAddLeadForm(false)}
        draftId={resumeDraft?.id}
        initialValues={resumeDraft?.data as Partial<AddLeadFormValues> | undefined}
      />
      <ImportLeadsModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
      <Modal isOpen={showSheetsSyncModal} onClose={() => setShowSheetsSyncModal(false)} title="Sync from Google Sheets" maxWidth="max-w-lg">
        <GoogleSheetsSyncForm />
      </Modal>
    </motion.div>
  );
}
