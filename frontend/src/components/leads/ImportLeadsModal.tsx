import { useState } from "react";
import { Modal } from "../common/Modal";
import { Select } from "../common/Input";
import { Button } from "../common/Button";
import { useBranches } from "../../hooks/useBranches";
import { useImportLeads } from "../../hooks/useLeads";
import type { ImportSummary } from "../../api/leads.api";

export function ImportLeadsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: branches } = useBranches();
  const importLeads = useImportLeads();
  const [branchId, setBranchId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!file || !branchId) return;
    setError(null);
    try {
      const result = await importLeads.mutateAsync({ file, branchId });
      setSummary(result);
    } catch {
      setError("Import failed — check the file format and try again.");
    }
  };

  const handleClose = () => {
    setFile(null);
    setSummary(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Leads from CSV / Excel">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-gray-500">
          Upload a .csv or .xlsx file with columns for name, phone, car model, enquiry type, and location (column
          names are matched flexibly). Existing phone numbers are merged into their existing lead history, not
          duplicated.
        </p>
        <Select label="Import into Branch" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">Select branch</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {summary && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
            <p>Total rows: {summary.totalRows}</p>
            <p className="text-green-700">Created: {summary.created}</p>
            <p className="text-amber-700">Merged into existing leads: {summary.merged}</p>
            <p className="text-red-700">Failed: {summary.failed}</p>
            {summary.errors.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600">
                {summary.errors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button type="button" isLoading={importLeads.isPending} disabled={!file || !branchId} onClick={handleImport}>
            Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
