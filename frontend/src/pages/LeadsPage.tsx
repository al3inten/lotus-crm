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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Car size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
            <p className="text-xs text-gray-500">Manage and follow up every enquiry across your showrooms.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {googleSheetsConnected && (
            <Button variant="secondary" icon={<FileSpreadsheet size={14} />} onClick={() => setShowSheetsSyncModal(true)}>
              Sync from Google Sheets
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowImportModal(true)}>
            Import from Sheet/Excel
          </Button>
          <Button onClick={() => setShowWalkInForm(true)}>+ Add Walk-in Lead</Button>
        </div>
      </div>

      <Card>
        <LeadFilters filters={filters} onChange={setFilters} />
      </Card>

      {isLoading || !data ? (
        <Card>
          <p className="py-8 text-center text-sm text-gray-500">Loading leads…</p>
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <LeadTable enquiries={data.items} />
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
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
