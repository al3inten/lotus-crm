import { useState, useMemo } from "react";
import { CarFront, Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicleModels } from "../hooks/useVehicles";
import { useAuth } from "../context/AuthContext";
import { VehicleCard } from "../components/vehicles/VehicleCard";
import { VehicleEditorModal } from "../components/vehicles/VehicleEditorModal";
import { Button } from "../components/common/Button";
import type { VehicleModel } from "../types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 120, damping: 17 } 
  }
};

export function VehiclesPage() {
  const { data: vehicles, isLoading } = useVehicleModels();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [filterFuel, setFilterFuel] = useState<string>("ALL");
  const [filterTrans, setFilterTrans] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NAME_ASC");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleModel | undefined>();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    let result = vehicles.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase());
      
      // If super admin, search both active and inactive variants, otherwise only active
      const matchesFuel = filterFuel === "ALL" || v.variants.some(
        (varItem) => varItem.fuelType === filterFuel && (isSuperAdmin || varItem.isActive)
      );
      
      const matchesTrans = filterTrans === "ALL" || v.variants.some(
        (varItem) => varItem.transmissionType === filterTrans && (isSuperAdmin || varItem.isActive)
      );
      
      const matchesStatus = filterStatus === "ALL" 
        ? (isSuperAdmin ? true : v.isActive)
        : filterStatus === "ACTIVE" 
          ? v.isActive 
          : !v.isActive;

      return matchesSearch && matchesFuel && matchesTrans && matchesStatus;
    });

    // Apply Sorting
    return [...result].sort((a, b) => {
      if (sortBy === "NAME_ASC") return a.name.localeCompare(b.name);
      if (sortBy === "NAME_DESC") return b.name.localeCompare(a.name);
      if (sortBy === "CONFIGS_DESC") {
        const aCount = a.variants.filter(v => isSuperAdmin || v.isActive).length;
        const bCount = b.variants.filter(v => isSuperAdmin || v.isActive).length;
        return bCount - aCount;
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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col gap-6"
    >
      {/* Hero Header */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 shadow-xl dark:bg-slate-950 sm:px-10 sm:py-12"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[50%] h-[200%] w-[50%] rounded-full bg-cyan-600/20 blur-[100px] dark:bg-cyan-600/10" />
          <div className="absolute -right-[20%] top-[-20%] h-[150%] w-[60%] rounded-full bg-blue-500/20 blur-[120px] dark:bg-blue-500/10" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner ring-1 ring-white/20 backdrop-blur-md">
              <CarFront size={26} />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Vehicle Portfolio</h1>
              <p className="mt-1 text-sm font-medium text-slate-300">Browse models, variants, and configurations available at your showrooms.</p>
            </div>
          </div>
          {isSuperAdmin && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
                Add Vehicle
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between"
      >
        {/* Search box */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vehicle models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-0 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700/50 dark:focus:bg-slate-800 dark:focus:ring-blue-500"
          />
        </div>

        {/* Filters area */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Fuel Filter */}
          <select
            value={filterFuel}
            onChange={(e) => setFilterFuel(e.target.value)}
            className="rounded-xl border-0 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700/50 dark:focus:bg-slate-800 dark:focus:ring-blue-500"
          >
            <option value="ALL">All Fuel Types</option>
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="CNG_PETROL">CNG/Petrol</option>
            <option value="ELECTRIC">Electric</option>
          </select>

          {/* Transmission Filter */}
          <select
            value={filterTrans}
            onChange={(e) => setFilterTrans(e.target.value)}
            className="rounded-xl border-0 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700/50 dark:focus:bg-slate-800 dark:focus:ring-blue-500"
          >
            <option value="ALL">All Transmissions</option>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATIC">Automatic</option>
          </select>

          {/* Status Filter (Super Admin Only) */}
          {isSuperAdmin && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border-0 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700/50 dark:focus:bg-slate-800 dark:focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Models Only</option>
              <option value="INACTIVE">Inactive Models Only</option>
            </select>
          )}

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border-0 bg-slate-50 py-2.5 pl-3 pr-10 text-sm font-medium text-slate-900 ring-1 ring-inset ring-slate-200 transition-all focus:bg-white focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800/50 dark:text-white dark:ring-slate-700/50 dark:focus:bg-slate-800 dark:focus:ring-blue-500"
          >
            <option value="NAME_ASC">Sort: A - Z</option>
            <option value="NAME_DESC">Sort: Z - A</option>
            <option value="CONFIGS_DESC">Sort: Most Configs</option>
          </select>
        </div>
      </motion.div>

      {/* Vehicle Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 text-slate-500"
        >
          <CarFront size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No vehicles found</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </motion.div>
      ) : (
        <motion.div 
          layout
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredVehicles.map(vehicle => (
              <motion.div
                layout
                key={vehicle.id}
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <VehicleCard 
                  vehicle={vehicle} 
                  isSuperAdmin={isSuperAdmin}
                  onEdit={() => handleEdit(vehicle)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {isEditorOpen && (
        <VehicleEditorModal
          vehicle={editingVehicle}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </motion.div>
  );
}
