import { useState } from "react";
import { Edit, CarFront, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { VehicleModel, VehicleVariant } from "../../types";

interface VehicleCardProps {
  vehicle: VehicleModel;
  onEdit: () => void;
  isSuperAdmin: boolean;
}

function getIconColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 6;
  
  const colors = [
    "bg-blue-50 text-blue-600 ring-2 ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20",
    "bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20",
    "bg-violet-50 text-violet-600 ring-2 ring-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20",
    "bg-orange-50 text-orange-600 ring-2 ring-orange-500/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20",
    "bg-rose-50 text-rose-600 ring-2 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20",
    "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"
  ];
  
  return colors[index];
}

export function VehicleCard({ vehicle, onEdit, isSuperAdmin }: VehicleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Super Admins see all configurations (active + inactive), normal users only see active ones
  const displayedVariants = isSuperAdmin
    ? vehicle.variants
    : vehicle.variants.filter((v) => v.isActive);

  const activeCount = vehicle.variants.filter((v) => v.isActive).length;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-[#f5f5f7] dark:bg-[#1d1d1f] p-6 sm:p-8 transition-transform duration-500 hover:scale-[1.02]">
      
      {/* Header Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {/* Dynamically Colored Car Icon */}
          <div className={clsx(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset shadow-inner transition-transform duration-300 group-hover:scale-110",
            getIconColor(vehicle.name)
          )}>
            <CarFront size={28} />
          </div>
          
          <div className="flex flex-col items-start gap-1">
            <span
              className={clsx(
                "text-[10px] font-extrabold uppercase tracking-widest",
                vehicle.isActive ? "text-emerald-500" : "text-slate-400"
              )}
            >
              {vehicle.isActive ? "Available" : "Unavailable"}
            </span>
            
            {/* Highlighted Model Name */}
            <div className="inline-flex rounded-xl bg-slate-900 px-3.5 py-1.5 text-white dark:bg-white dark:text-slate-900 shadow-md">
              <h3 className="text-lg font-black tracking-tight leading-none">
                {vehicle.name}
              </h3>
            </div>
          </div>
        </div>
        
        {isSuperAdmin && (
          <button
            onClick={onEdit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-white text-[#1d1d1f] shadow-sm transition-all hover:bg-[#1d1d1f] hover:text-white dark:border-[#3d3d3f] dark:bg-[#2d2d2f] dark:text-white dark:hover:bg-white dark:hover:text-[#1d1d1f]"
            title="Edit Vehicle"
          >
            <Edit size={14} />
          </button>
        )}
      </div>

      {/* Accordion Toggle Trigger */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-6 flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 dark:bg-[#2d2d2f] shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 dark:hover:bg-[#343436] cursor-pointer text-slate-800 dark:text-slate-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868b]">
            Configurations
          </span>
          <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[10px] font-extrabold text-slate-600 dark:bg-[#1d1d1f] dark:text-slate-300">
            {activeCount} Active
          </span>
        </div>
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Collapsible Variants List */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-3 pt-4 flex-1">
          {displayedVariants.length > 0 ? (
            displayedVariants.map((variant) => (
              <AppleVariantRow key={variant.id} variant={variant} />
            ))
          ) : (
            <p className="text-sm font-medium text-[#86868b] italic p-2 text-center">No configurations configured.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function AppleVariantRow({ variant }: { variant: VehicleVariant }) {
  const getFuelStyle = (fuel: string, isActive: boolean) => {
    if (!isActive) return "bg-slate-100 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700/50";
    switch (fuel) {
      case "PETROL": return "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20";
      case "DIESEL": return "bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20";
      case "ELECTRIC": return "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20";
      case "CNG_PETROL": return "bg-lime-50 text-lime-700 ring-lime-600/10 dark:bg-lime-500/10 dark:text-lime-400 dark:ring-lime-500/20";
      default: return "bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700";
    }
  };

  const getTransStyle = (trans: string, isActive: boolean) => {
    if (!isActive) return "bg-slate-100 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700/50";
    return trans === "AUTOMATIC"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-600/10 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"
      : "bg-slate-100 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700";
  };

  const formatFuel = (fuel: string) => fuel === "CNG_PETROL" ? "CNG/Petrol" : fuel.charAt(0) + fuel.slice(1).toLowerCase();

  return (
    <div className={clsx(
      "flex items-center justify-between rounded-2xl border border-[#e5e5e7] bg-white dark:border-[#2d2d2f] dark:bg-[#2d2d2f] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-md cursor-default group/row",
      !variant.isActive && "opacity-60 saturate-50"
    )}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
            {variant.name}
          </span>
          {!variant.isActive && (
            <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset", getFuelStyle(variant.fuelType, variant.isActive))}>
            {formatFuel(variant.fuelType)}
          </span>
          <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset", getTransStyle(variant.transmissionType, variant.isActive))}>
            {variant.transmissionType === "AUTOMATIC" ? "Automatic" : "Manual"}
          </span>
        </div>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white opacity-0 group-hover/row:opacity-100 transition-opacity">
        <ChevronRight size={16} />
      </div>
    </div>
  );
}
