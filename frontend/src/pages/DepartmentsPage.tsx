import { useState } from "react";
import { useBranches } from "../hooks/useBranches";
import { useBranchStaff } from "../hooks/useUsers";
import { BranchList } from "../components/departments/BranchList";
import { BranchForm } from "../components/departments/BranchForm";
import { AddStaffModal } from "../components/departments/AddStaffModal";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";

type Tab = "CR_TEAM" | "CONSULTANT";

export function DepartmentsPage() {
  const { data: branches, isLoading } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("CR_TEAM");
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);

  const activeBranchId = selectedBranchId ?? branches?.[0]?.id ?? null;
  const { data: staff, isLoading: staffLoading } = useBranchStaff(activeBranchId ?? undefined, tab);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Branches</h2>
          <Button variant="secondary" onClick={() => setShowBranchForm(true)}>
            + Branch
          </Button>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <BranchList
            branches={branches ?? []}
            selectedBranchId={activeBranchId}
            onSelect={setSelectedBranchId}
          />
        )}
      </div>

      <div className="lg:col-span-2">
        {activeBranchId ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-2">
                {(["CR_TEAM", "CONSULTANT"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      tab === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t === "CR_TEAM" ? "CR Team" : "Consultants"}
                  </button>
                ))}
              </div>
              <Button onClick={() => setShowAddStaff(true)}>
                + Add {tab === "CR_TEAM" ? "CR Team Member" : "Consultant"}
              </Button>
            </div>

            {staffLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Phone</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staff?.length ? (
                      staff.map((member) => (
                        <tr key={member.id}>
                          <td className="px-4 py-2 font-medium text-gray-900">{member.name}</td>
                          <td className="px-4 py-2 text-gray-600">{member.email}</td>
                          <td className="px-4 py-2 text-gray-600">{member.phone ?? "—"}</td>
                          <td className="px-4 py-2 text-gray-600">{member.isActive ? "Active" : "Inactive"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                          No {tab === "CR_TEAM" ? "CR team members" : "consultants"} yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeBranchId && (
              <AddStaffModal
                branchId={activeBranchId}
                role={tab}
                isOpen={showAddStaff}
                onClose={() => setShowAddStaff(false)}
              />
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">Create a branch to start adding Consultants and CR Team members.</p>
        )}
      </div>

      <Modal isOpen={showBranchForm} onClose={() => setShowBranchForm(false)} title="Create Branch">
        <BranchForm onSuccess={() => setShowBranchForm(false)} />
      </Modal>
    </div>
  );
}
