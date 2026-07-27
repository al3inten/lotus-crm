import { useState } from "react";
import {
  Building2,
  Users,
  ShieldCheck,
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  UserCircle2,
  Landmark,
  Network,
} from "lucide-react";
import { useBranches } from "../hooks/useBranches";
import {
  useStaffDepartments,
  useCreateStaffDepartment,
  useDeleteStaffDepartment,
} from "../hooks/useStaffDepartments";
import { useBranchStaff, useDeleteUser } from "../hooks/useUsers";
import { useRoles, useDeleteRole, useUpdateRole, useDirectory } from "../hooks/useRoles";
import { BranchList } from "../components/departments/BranchList";
import { BranchForm } from "../components/departments/BranchForm";
import { AddStaffModal } from "../components/departments/AddStaffModal";
import { EditStaffModal } from "../components/departments/EditStaffModal";
import { RoleModal } from "../components/departments/RoleModal";
import { Button } from "../components/common/Button";
import { Modal } from "../components/common/Modal";
import { Card, CardHeader } from "../components/common/Card";
import { Toggle } from "../components/common/Toggle";
import { Input, Select } from "../components/common/Input";
import { MODULES } from "../types";
import type { RoleDefinition } from "../types";

// Vehicle models intentionally live only on the dedicated /vehicles page (sidebar),
// not as a tab here — they were previously duplicated across both.
type Tab = "overview" | "branches" | "roles" | "departments" | "staff";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <LayoutGrid size={15} /> },
  { key: "branches", label: "Branches", icon: <Building2 size={15} /> },
  { key: "roles", label: "Roles & Permissions", icon: <ShieldCheck size={15} /> },
  { key: "departments", label: "Departments", icon: <Network size={15} /> },
  { key: "staff", label: "Employees", icon: <Users size={15} /> },
];

const ROLE_BADGES: Record<string, string> = {
  SUPER_ADMIN: "bg-gray-900 text-white",
  ADMIN: "bg-violet-100 text-violet-700",
  BRANCH_MANAGER: "bg-primary-100 text-primary-700",
  CR_TEAM: "bg-emerald-100 text-emerald-700",
  CONSULTANT: "bg-amber-100 text-amber-700",
};

function RoleBadge({ role, roleName }: { role: string; roleName?: string | null }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGES[role] ?? "bg-gray-100 text-gray-600"}`}>
      {roleName ?? role.replaceAll("_", " ")}
    </span>
  );
}

/* ---------- Overview: branch-wise / department-wise directory ---------- */

function OverviewTab() {
  const { data: directory, isLoading } = useDirectory();

  if (isLoading || !directory) return <p className="text-sm text-gray-500">Loading directory…</p>;

  return (
    <div className="flex flex-col gap-4">
      {directory.headOffice.length > 0 && (
        <Card>
          <CardHeader
            icon={<Landmark size={20} />}
            iconClassName="bg-gray-100 text-gray-700"
            title="Head Office"
            subtitle="Cross-branch administrators"
          />
          <ul className="divide-y divide-gray-100">
            {directory.headOffice.map((person) => (
              <li key={person.id} className="flex items-center justify-between py-2">
                <span className="flex items-center gap-2 text-sm text-gray-900">
                  <UserCircle2 size={18} className="text-gray-300" />
                  {person.name}
                  <span className="text-xs text-gray-400">{person.email}</span>
                </span>
                <RoleBadge role={person.role} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {directory.branches.map((branch) => {
          const byRole = new Map<string, typeof branch.users>();
          for (const person of branch.users) {
            const key = person.roleDefinition?.name ?? person.role;
            if (!byRole.has(key)) byRole.set(key, []);
            byRole.get(key)!.push(person);
          }

          return (
            <Card key={branch.id}>
              <CardHeader
                icon={<Building2 size={20} />}
                title={branch.name}
                subtitle={`${branch.code} · ${branch.city} · ${branch.users.length} staff`}
              />
              {branch.users.length === 0 ? (
                <p className="text-sm text-gray-400">No staff yet — add them from the Staff tab.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {[...byRole.entries()].map(([groupName, people]) => (
                    <div key={groupName}>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {groupName.replaceAll("_", " ")} ({people.length})
                      </p>
                      <ul className="flex flex-col gap-1">
                        {people.map((person) => (
                          <li key={person.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm">
                            <span className="text-gray-900">{person.name}</span>
                            <span className="text-xs text-gray-400">{person.email}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Roles & Permissions ---------- */

function RolesTab() {
  const { data: branches } = useBranches();
  const [branchFilter, setBranchFilter] = useState("");
  const { data: roles, isLoading } = useRoles(branchFilter || undefined);
  const deleteRole = useDeleteRole();
  const updateRole = useUpdateRole();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RoleDefinition | null>(null);

  const moduleLabel = (key: string) => MODULES.find((m) => m.key === key)?.label ?? key;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <Select label="Filter by branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="">All roles</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Button icon={<Plus size={15} />} onClick={() => { setEditing(null); setShowModal(true); }}>
          Create Role
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (roles?.length ?? 0) === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            No custom roles yet. Create roles like "Assistant Manager" or "Senior CR" with exactly the dashboard
            modules each team should see.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roles!.map((role) => (
            <Card key={role.id} className={role.isActive ? "" : "opacity-60"}>
              <div className="flex items-start justify-between">
                <CardHeader
                  icon={<ShieldCheck size={20} />}
                  iconClassName="bg-violet-50 text-violet-600"
                  title={role.name}
                  subtitle={`${role.branch?.name ?? "All branches"} · ${role.baseRole.replaceAll("_", " ")} level · ${role._count?.users ?? 0} member(s)`}
                />
                <div className="flex items-center gap-1">
                  <button
                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    onClick={() => { setEditing(role); setShowModal(true); }}
                    aria-label="Edit role"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    onClick={() => deleteRole.mutate(role.id)}
                    disabled={(role._count?.users ?? 0) > 0}
                    title={(role._count?.users ?? 0) > 0 ? "Reassign members before deleting" : "Delete role"}
                    aria-label="Delete role"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <span key={p} className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
                    {moduleLabel(p)}
                  </span>
                ))}
              </div>

              <div className="mt-3 border-t border-gray-100 pt-3">
                <Toggle
                  label="Active"
                  checked={role.isActive}
                  onChange={(on) => updateRole.mutate({ roleId: role.id, payload: { isActive: on } })}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <RoleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        branches={branches ?? []}
        editing={editing}
        defaultBranchId={branchFilter || undefined}
      />
    </div>
  );
}

/* ---------- Branches ---------- */

function BranchesTab() {
  const { data: branches, isLoading } = useBranches();
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button icon={<Plus size={15} />} onClick={() => setShowBranchForm(true)}>
          Add Branch
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <BranchList branches={branches ?? []} selectedBranchId={selectedBranchId} onSelect={setSelectedBranchId} />
      )}
      <Modal isOpen={showBranchForm} onClose={() => setShowBranchForm(false)} title="Create Branch">
        <BranchForm onSuccess={() => setShowBranchForm(false)} />
      </Modal>
    </div>
  );
}

/* ---------- Staff ---------- */

/* ---------- Departments (per branch) ---------- */

function DepartmentsTab() {
  const { data: branches } = useBranches();
  const [branchId, setBranchId] = useState<string>("");
  const activeBranchId = branchId || branches?.[0]?.id || "";
  const { data: departments, isLoading } = useStaffDepartments(activeBranchId || undefined, !!activeBranchId);
  const createDepartment = useCreateStaffDepartment();
  const deleteDepartment = useDeleteStaffDepartment();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apiError = (err: unknown) =>
    (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Something went wrong.";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeBranchId) return;
    setError(null);
    createDepartment.mutate(
      { name: name.trim(), branchId: activeBranchId },
      { onSuccess: () => setName(""), onError: (err) => setError(apiError(err)) }
    );
  };

  const handleDelete = (dept: { id: string; name: string }) => {
    if (!window.confirm(`Delete "${dept.name}"? Only possible if no employees belong to it.`)) return;
    setError(null);
    deleteDepartment.mutate(dept.id, { onError: (err) => setError(apiError(err)) });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Departments" subtitle="Org units inside a branch. Every employee must belong to one." />
        <div className="flex flex-col gap-3 p-4 pt-0">
          <Select label="Branch" value={activeBranchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <form onSubmit={handleCreate} className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="New department"
                placeholder="e.g. Sales, Service, HR"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" icon={<Plus size={15} />} isLoading={createDepartment.isPending} disabled={!name.trim()}>
              Add
            </Button>
          </form>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !departments?.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No departments in this branch yet</p>
          <p className="mt-1 text-sm text-slate-500">Add one above before creating employees here.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{dept.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {dept._count?.users ?? 0} employee{(dept._count?.users ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(dept)}
                  aria-label={`Delete ${dept.name}`}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffTab() {
  const { data: branches } = useBranches();
  const [branchId, setBranchId] = useState<string>("");
  const activeBranchId = branchId || branches?.[0]?.id || "";
  const { data: staff, isLoading } = useBranchStaff(activeBranchId || undefined);
  const deleteUser = useDeleteUser();
  const [showAdd, setShowAdd] = useState(false);
  const [editingMember, setEditingMember] = useState<(typeof staff extends (infer T)[] | undefined ? T : never) | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = (member: { id: string; name: string }) => {
    if (!window.confirm(`Delete ${member.name}? Only possible if they have no linked records — otherwise deactivate them via Edit.`)) return;
    setDeleteError(null);
    deleteUser.mutate(member.id, {
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? "Could not delete this member.";
        setDeleteError(message);
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <Select label="Branch" value={activeBranchId} onChange={(e) => setBranchId(e.target.value)}>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Button icon={<Plus size={15} />} disabled={!activeBranchId} onClick={() => setShowAdd(true)}>
          Add Team Member
        </Button>
      </div>

      {deleteError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{deleteError}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff?.length ? (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{member.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{member.email}</td>
                    <td className="px-4 py-2.5 text-gray-600">{member.phone ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <RoleBadge role={member.role} roleName={member.roleDefinition?.name} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${member.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                        {member.isActive ? "● Active" : "○ Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          onClick={() => setEditingMember(member)}
                          aria-label={`Edit ${member.name}`}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(member)}
                          aria-label={`Delete ${member.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No staff in this branch yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeBranchId && <AddStaffModal branchId={activeBranchId} isOpen={showAdd} onClose={() => setShowAdd(false)} />}
      {editingMember && activeBranchId && (
        <EditStaffModal
          member={editingMember}
          branchId={activeBranchId}
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}
    </div>
  );
}


/* ---------- Page ---------- */

export function BranchesPage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-primary-300 ring-1 ring-inset ring-primary-500/20 backdrop-blur-md">
              Organization Hub
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Branches
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Manage branches, their roles and departments, and the employees in each — all in one place.
            </p>
          </div>
        </div>
      </div>

        <div className="flex gap-1 rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-sm w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-primary-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <main>
          {tab === "overview" && <OverviewTab />}
          {tab === "branches" && <BranchesTab />}
          {tab === "roles" && <RolesTab />}
          {tab === "departments" && <DepartmentsTab />}
          {tab === "staff" && <StaffTab />}
        </main>
    </div>
  );
}
