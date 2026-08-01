import { useEffect, useState } from "react";
import { Loader2, Save, Target } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { LocationBranchSelect } from "../common/LocationBranchSelect";
import { useVehicleModelTargets, useUpsertVehicleModelTarget } from "../../hooks/useVehicleTargets";
import type { VehicleModelTargetRow } from "../../api/vehicleTargets.api";

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Row edit state keeps the two numbers as strings so the field can be cleared to blank
// while typing — parsing to Number on every keystroke made "" snap straight back to 0,
// which meant it could never be emptied out to type a fresh value.
interface RowDraft {
  target: string;
  stock: string;
}

function toDraft(row: VehicleModelTargetRow): RowDraft {
  return { target: String(row.bookingTarget), stock: String(row.stock) };
}

function toNumber(value: string): number {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? 0 : n;
}

/** One editable row — booking target + stock for a model. Edits are held locally and only
 * reach the server when the modal's "Save Changes" button is clicked. */
function TargetRow({
  row,
  draft,
  onChange,
}: {
  row: VehicleModelTargetRow;
  draft: RowDraft;
  onChange: (modelId: string, draft: RowDraft) => void;
}) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/80">
      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{row.modelName}</td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          value={draft.target}
          onChange={(e) => onChange(row.modelId, { ...draft, target: e.target.value })}
          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm tabular-nums focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          value={draft.stock}
          onChange={(e) => onChange(row.modelId, { ...draft, stock: e.target.value })}
          className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm tabular-nums focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </td>
    </tr>
  );
}

/** SUPER_ADMIN-only entry screen for the two numbers nothing else in the CRM tracks —
 * booking target and stock-in-hand per model/branch/month — feeding the Model-wise MIS
 * report's "Bkg Tgt"/"Stock" columns (see backend VehicleModelTarget). */
export function VehicleTargetsModal({ onClose }: { onClose: () => void }) {
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [branchId, setBranchId] = useState("");
  const [month, setMonth] = useState(currentMonthKey());

  const { data: targets, isLoading } = useVehicleModelTargets(branchId, month);
  const upsert = useUpsertVehicleModelTarget(branchId, month);

  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});

  // Re-seed local drafts whenever the server data for this branch/month arrives (initial
  // load or switching branch/month) — never while the manager still has unsaved edits open.
  useEffect(() => {
    if (!targets) return;
    setDrafts(Object.fromEntries(targets.map((t) => [t.modelId, toDraft(t)])));
  }, [targets]);

  const handleChange = (modelId: string, draft: RowDraft) => {
    setDrafts((prev) => ({ ...prev, [modelId]: draft }));
  };

  const isDirty = (row: VehicleModelTargetRow): boolean => {
    const draft = drafts[row.modelId];
    if (!draft) return false;
    return toNumber(draft.target) !== row.bookingTarget || toNumber(draft.stock) !== row.stock;
  };

  const dirtyRows = (targets ?? []).filter(isDirty);

  const handleSaveAll = async () => {
    for (const row of dirtyRows) {
      const draft = drafts[row.modelId];
      await upsert.mutateAsync({ modelId: row.modelId, bookingTarget: toNumber(draft.target), stock: toNumber(draft.stock) });
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Booking Targets & Stock" maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        <p className="rounded-md bg-gray-50 p-2 text-xs text-gray-600 dark:bg-slate-800/60 dark:text-slate-400">
          Set each model's booking target and stock-in-hand for a branch/month — feeds the Model-wise report's
          "Bkg Tgt", "Achv%" and "Stock" columns. Nothing else updates these automatically. Edits are only saved
          when you click "Save Changes".
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <LocationBranchSelect
            locationId={locationId}
            branchId={branchId || undefined}
            allowAll={false}
            onChange={({ locationId: nextLocationId, branchId: nextBranchId }) => {
              setLocationId(nextLocationId);
              setBranchId(nextBranchId ?? "");
            }}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>
        </div>

        {!branchId ? (
          <p className="py-6 text-center text-sm text-slate-400">Select a branch to edit its targets.</p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                  <tr>
                    <th className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                      <span className="inline-flex items-center gap-1">
                        <Target size={12} /> Model
                      </span>
                    </th>
                    <th className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">Booking Target</th>
                    <th className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {targets?.map((row) => (
                    <TargetRow key={row.modelId} row={row} draft={drafts[row.modelId] ?? toDraft(row)} onChange={handleChange} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-3">
              {dirtyRows.length > 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {dirtyRows.length} model{dirtyRows.length === 1 ? "" : "s"} changed
                </span>
              )}
              <Button
                icon={upsert.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                disabled={dirtyRows.length === 0 || upsert.isPending}
                onClick={handleSaveAll}
              >
                Save Changes
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
