import { useState } from "react";
import { Car, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { useLeads } from "../hooks/useLeads";
import type { LeadFilters as LeadFiltersType } from "../api/leads.api";
import { LeadFilters } from "../components/leads/LeadFilters";
import { LeadTable } from "../components/leads/LeadTable";
import { WalkInLeadForm } from "../components/leads/WalkInLeadForm";
import { ImportLeadsModal } from "../components/leads/ImportLeadsModal";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Modal } from "../components/common/Modal";
import { GoogleSheetsSyncForm } from "../components/integrations/GoogleSheetsSyncForm";
import { useIntegrations } from "../hooks/useIntegrations";

const PAGE_SIZE = 20;

export function LeadsPage() {
  const [filters, setFilters] = useState<LeadFiltersType>({ page: 1, pageSize: PAGE_SIZE });
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSheetsSyncModal, setShowSheetsSyncModal] = useState(false);

  const { data, isLoading } = useLeads(filters);
  const { data: integrations } = useIntegrations();
  const googleSheetsConnected = integrations?.find((i) => i.key === "GOOGLE_SHEETS")?.hasCredentials ?? false;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col gap-4">
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
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Leads</h1>
              <p className="mt-1 text-base font-medium text-slate-300">Manage and follow up every enquiry across your showrooms.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {googleSheetsConnected && (
              <Button variant="secondary" icon={<FileSpreadsheet size={14} />} onClick={() => setShowSheetsSyncModal(true)}>
                Sync
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              Import
            </Button>
            <Button onClick={() => setShowWalkInForm(true)}>+ Add Walk-in Lead</Button>
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

      <WalkInLeadForm isOpen={showWalkInForm} onClose={() => setShowWalkInForm(false)} />
      <ImportLeadsModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
      <Modal isOpen={showSheetsSyncModal} onClose={() => setShowSheetsSyncModal(false)} title="">
        <GoogleSheetsSyncForm />
      </Modal>
    </div>
  );
}
