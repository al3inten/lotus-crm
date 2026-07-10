import { useState } from "react";
import { Car, ChevronLeft, ChevronRight, FileSpreadsheet, Users, MessageSquare, Building2, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";
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
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.35, ease: "easeOut" as const } 
  }
};

export function LeadsPage() {
  const [filters, setFilters] = useState<LeadFiltersType>({ page: 1, pageSize: PAGE_SIZE });
  const [showAddLeadForm, setShowAddLeadForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSheetsSyncModal, setShowSheetsSyncModal] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<LeadDraft | undefined>(undefined);
  const [view, setView] = useState<"list" | "kanban">("list");

  const { data, isLoading } = useLeads(filters);
  const { data: integrations } = useIntegrations();
  const googleSheetsConnected = integrations?.find((i) => i.key === "GOOGLE_SHEETS")?.hasCredentials ?? false;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={pageVariants}
      className="flex flex-col gap-4"
    >
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 shadow-xl dark:bg-slate-950 sm:px-10 sm:py-12 mb-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[50%] h-[200%] w-[50%] rounded-full bg-blue-600/20 blur-[100px] dark:bg-blue-600/10" />
          <div className="absolute -right-[20%] top-[-20%] h-[150%] w-[60%] rounded-full bg-indigo-500/20 blur-[120px] dark:bg-indigo-500/10" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-md">
              <Car size={26} />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Leads Management</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users size={16} className="text-blue-400" /> 
                  Customer Relationships
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-emerald-400" /> 
                  Follow-ups
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />
                <span className="flex items-center gap-1.5">
                  <Building2 size={16} className="text-indigo-400" /> 
                  Across Showrooms
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg bg-white/10 p-1 backdrop-blur-md ring-1 ring-white/20">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                <List size={16} />
                List
              </button>
              <button
                onClick={() => setView("kanban")}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === "kanban" ? "bg-white text-blue-600 shadow-sm" : "text-slate-300 hover:text-white"
                }`}
              >
                <LayoutGrid size={16} />
                Kanban
              </button>
            </div>

            {googleSheetsConnected && (
              <Button variant="secondary" icon={<FileSpreadsheet size={14} />} onClick={() => setShowSheetsSyncModal(true)}>
                Sync
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              Import
            </Button>
            <LeadDraftsButton
              onResume={(draft) => {
                setResumeDraft(draft);
                setShowAddLeadForm(true);
              }}
            />
            <Button
              onClick={() => {
                setResumeDraft(undefined);
                setShowAddLeadForm(true);
              }}
            >
              + Add Lead
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <LeadFilters filters={filters} onChange={setFilters} />
      </Card>

      {isLoading || !data ? (
        <Card>
          <p className="py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">Loading leads…</p>
        </Card>
      ) : view === "kanban" ? (
        <LeadKanbanBoard enquiries={data.items} />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <LeadTable enquiries={data.items} />
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              Page {data.page} of {totalPages} · {data.total} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<ChevronLeft size={14} />}
                disabled={data.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                disabled={data.page >= totalPages}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </Card>
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
