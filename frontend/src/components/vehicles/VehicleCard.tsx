import { useState } from "react";
import { Pencil, CarFront, ChevronDown, Fuel, Cog } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import type { VehicleModel, VehicleVariant } from "../../types";

interface VehicleCardProps {
  vehicle: VehicleModel;
  onEdit: () => void;
  isSuperAdmin: boolean;
}

const FUEL_LABELS: Record<string, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  ELECTRIC: "Electric",
  CNG_PETROL: "CNG/Petrol",
};

/** Fuel type → Badge variant, using the shared palette instead of ad-hoc hex colors. */
const FUEL_VARIANT: Record<string, "default" | "neutral" | "success" | "warning"> = {
  PETROL: "warning",
  DIESEL: "default",
  ELECTRIC: "success",
  CNG_PETROL: "neutral",
};

export function VehicleCard({ vehicle, onEdit, isSuperAdmin }: VehicleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Super Admins see all configurations (active + inactive); everyone else only active.
  const displayedVariants = isSuperAdmin ? vehicle.variants : vehicle.variants.filter((v) => v.isActive);
  const activeCount = vehicle.variants.filter((v) => v.isActive).length;

  return (
    <div
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        "dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700",
        !vehicle.isActive && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
            <CarFront size={22} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white">
              {vehicle.name}
            </h3>
            <Badge variant={vehicle.isActive ? "success" : "neutral"} className="mt-1">
              {vehicle.isActive ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${vehicle.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Configurations
          </span>
          <Badge variant="neutral">{activeCount} active</Badge>
        </span>
        <ChevronDown
          size={16}
          className={cn("text-slate-400 transition-transform duration-200", isExpanded && "rotate-180")}
        />
      </button>

      <motion.div
        initial={false}
        animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-2 pt-3">
          {displayedVariants.length > 0 ? (
            displayedVariants.map((variant) => <VariantRow key={variant.id} variant={variant} />)
          ) : (
            <p className="py-3 text-center text-sm text-slate-500 dark:text-slate-400">
              No configurations yet.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function VariantRow({ variant }: { variant: VehicleVariant }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-800 dark:bg-slate-800/40",
        !variant.isActive && "opacity-60"
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{variant.name}</span>
          {!variant.isActive && <Badge variant="neutral">Inactive</Badge>}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={variant.isActive ? FUEL_VARIANT[variant.fuelType] ?? "neutral" : "neutral"}>
            <Fuel size={11} />
            {FUEL_LABELS[variant.fuelType] ?? variant.fuelType}
          </Badge>
          <Badge variant="outline">
            <Cog size={11} />
            {variant.transmissionType === "AUTOMATIC" ? "Automatic" : "Manual"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
