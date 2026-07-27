import { useState, useMemo } from "react";
import { CarFront, Search, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicleModels } from "../hooks/useVehicles";
import { useAuth } from "../context/AuthContext";
import { VehicleCard } from "../components/vehicles/VehicleCard";
import { VehicleEditorModal } from "../components/vehicles/VehicleEditorModal";
import { Button } from "../components/common/Button";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Skeleton } from "../components/ui/skeleton";
import { fadeUp, staggerContainer } from "../lib/motion";
import type { VehicleModel } from "../types";

const FUEL_OPTIONS = [
  { value: "ALL", label: "All fuel types" },
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "CNG_PETROL", label: "CNG/Petrol" },
  { value: "ELECTRIC", label: "Electric" },
];

const TRANS_OPTIONS = [
  { value: "ALL", label: "All transmissions" },
  { value: "MANUAL", label: "Manual" },
  { value: "AUTOMATIC", label: "Automatic" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active only" },
  { value: "INACTIVE", label: "Inactive only" },
];

const SORT_OPTIONS = [
  { value: "NAME_ASC", label: "Name: A–Z" },
  { value: "NAME_DESC", label: "Name: Z–A" },
  { value: "CONFIGS_DESC", label: "Most configurations" },
];

export function VehiclesPage() {
  const { data: vehicles, isLoading } = useVehicleModels();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterFuel, setFilterFuel] = useState("ALL");
  const [filterTrans, setFilterTrans] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("NAME_ASC");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleModel | undefined>();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hasFilters = search !== "" || filterFuel !== "ALL" || filterTrans !== "ALL" || filterStatus !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setFilterFuel("ALL");
    setFilterTrans("ALL");
    setFilterStatus("ALL");
  };

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];

    const result = vehicles.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());

      // Non-admins only ever match against variants that are active.
      const matchesFuel =
        filterFuel === "ALL" ||
        v.variants.some((item) => item.fuelType === filterFuel && (isSuperAdmin || item.isActive));

      const matchesTrans =
        filterTrans === "ALL" ||
        v.variants.some((item) => item.transmissionType === filterTrans && (isSuperAdmin || item.isActive));

      const matchesStatus =
        filterStatus === "ALL" ? (isSuperAdmin ? true : v.isActive) : filterStatus === "ACTIVE" ? v.isActive : !v.isActive;

      return matchesSearch && matchesFuel && matchesTrans && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sortBy === "NAME_DESC") return b.name.localeCompare(a.name);
      if (sortBy === "CONFIGS_DESC") {
        const count = (m: VehicleModel) => m.variants.filter((v) => isSuperAdmin || v.isActive).length;
        return count(b) - count(a);
      }
      return 0;
    });
  }, [vehicles, search, filterFuel, filterTrans, filterStatus, sortBy, isSuperAdmin]);

  const handleEdit = (vehicle: VehicleModel) => {
    setEditingVehicle(vehicle);
    setIsEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingVehicle(undefined);
    setIsEditorOpen(true);
  };

  // NOTE: the shared variants in lib/motion use the "show" state name (not "visible") —
  // using the wrong name leaves every child stuck in `hidden`, i.e. opacity 0.
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="flex flex-col gap-5">
      {/* ---------- HERO HEADER ---------- */}
      <motion.div variants={fadeUp} className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-md">
              <CarFront size={26} />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Vehicle Models</h1>
              <p className="mt-1.5 text-sm font-medium text-slate-300">
                Browse models, variants and configurations available at your showrooms.
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <Button icon={<Plus size={16} />} onClick={handleCreate}>
              Add Vehicle
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center"
      >
        <div className="relative w-full lg:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search models…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          <FilterSelect value={filterFuel} onChange={setFilterFuel} options={FUEL_OPTIONS} ariaLabel="Filter by fuel type" />
          <FilterSelect value={filterTrans} onChange={setFilterTrans} options={TRANS_OPTIONS} ariaLabel="Filter by transmission" />
          {isSuperAdmin && (
            <FilterSelect value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTIONS} ariaLabel="Filter by status" />
          )}
          <FilterSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} ariaLabel="Sort models" />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* Result count */}
      {!isLoading && (
        <motion.div variants={fadeUp} className="flex items-center gap-2">
          <Badge variant="neutral">
            {filteredVehicles.length} {filteredVehicles.length === 1 ? "model" : "models"}
          </Badge>
        </motion.div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-900/50"
        >
          <CarFront size={40} className="mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-base font-semibold text-slate-900 dark:text-white">No vehicles found</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {hasFilters ? "Try adjusting your search or filters." : "Add a vehicle model to get started."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div layout variants={fadeUp} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredVehicles.map((vehicle) => (
              <motion.div
                layout
                key={vehicle.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <VehicleCard vehicle={vehicle} isSuperAdmin={isSuperAdmin} onEdit={() => handleEdit(vehicle)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {isEditorOpen && <VehicleEditorModal vehicle={editingVehicle} onClose={() => setIsEditorOpen(false)} />}
    </motion.div>
  );
}

/** Compact Radix select used across the filter bar. */
function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={ariaLabel} className="w-auto min-w-[10.5rem]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
