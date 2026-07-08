import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { 
  useCreateVehicleModel, 
  useUpdateVehicleModel, 
  useDeleteVehicleModel, 
  useCreateVehicleVariant, 
  useUpdateVehicleVariant, 
  useDeleteVehicleVariant 
} from "../../hooks/useVehicles";
import type { VehicleModel, TransmissionType, FuelType } from "../../types";

interface VehicleEditorModalProps {
  vehicle?: VehicleModel;
  onClose: () => void;
}

export function VehicleEditorModal({ vehicle, onClose }: VehicleEditorModalProps) {
  const { mutateAsync: createModel } = useCreateVehicleModel();
  const { mutateAsync: updateModel } = useUpdateVehicleModel();
  const { mutateAsync: deleteModel } = useDeleteVehicleModel();
  const { mutateAsync: createVariant } = useCreateVehicleVariant();
  const { mutateAsync: updateVariant } = useUpdateVehicleVariant();
  const { mutateAsync: deleteVariant } = useDeleteVehicleVariant();
  
  const isEditing = !!vehicle;
  const [modelName, setModelName] = useState(vehicle?.name || "");
  const [isActive, setIsActive] = useState(vehicle?.isActive ?? true);
  const [variants, setVariants] = useState(
    vehicle?.variants.map(v => ({ ...v, _isNew: false })) || []
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: `temp-${Date.now()}`,
        modelId: vehicle?.id || "",
        name: "",
        transmissionType: "MANUAL",
        fuelType: "PETROL",
        isActive: true,
        _isNew: true,
      } as any,
    ]);
  };

  const handleRemoveVariant = async (variantId: string, isNew: boolean) => {
    if (!isNew && vehicle) {
      if (confirm("Are you sure you want to delete this variant? This cannot be undone.")) {
        await deleteVariant(variantId);
        setVariants(variants.filter(v => v.id !== variantId));
      }
    } else {
      setVariants(variants.filter(v => v.id !== variantId));
    }
  };

  const handleUpdateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSave = async () => {
    if (!modelName.trim()) return alert("Model name is required");
    
    setIsSaving(true);
    try {
      let savedModelId = vehicle?.id;

      // 1. Save or Update Model
      if (isEditing && savedModelId) {
        await updateModel({ modelId: savedModelId, payload: { name: modelName, isActive } });
      } else {
        const newModel = await createModel({ name: modelName });
        savedModelId = newModel.id;
      }

      // 2. Save Variants (only if model saved successfully)
      if (savedModelId) {
        for (const variant of variants) {
          if (!variant.name.trim()) continue; // skip empty

          if ((variant as any)._isNew) {
            await createVariant({
              modelId: savedModelId,
              payload: {
                name: variant.name,
                transmissionType: variant.transmissionType as TransmissionType,
                fuelType: variant.fuelType as FuelType,
              },
            });
          } else if (isEditing) {
            await updateVariant({
              variantId: variant.id,
              payload: {
                name: variant.name,
                transmissionType: variant.transmissionType as TransmissionType,
                fuelType: variant.fuelType as FuelType,
                isActive: variant.isActive,
              },
            });
          }
        }
      }

      onClose();
    } catch (error) {
      console.error("Failed to save vehicle", error);
      alert("Failed to save vehicle. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModel = async () => {
    if (vehicle && confirm("Are you sure you want to completely delete this model and all its variants?")) {
      setIsSaving(true);
      try {
        await deleteModel(vehicle.id);
        onClose();
      } catch (error) {
        console.error("Failed to delete", error);
        alert("Failed to delete vehicle.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <Modal title={isEditing ? "Edit Vehicle Model" : "Add Vehicle Model"} isOpen={true} onClose={onClose}>
      <div className="space-y-6">
        
        {/* Model Details */}
        <div className="space-y-4 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/30">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Model Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300">
                Model Name
              </label>
              <input
                type="text"
                placeholder="e.g. Creta"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            {isEditing && (
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mt-5">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-900"
                  />
                  Model is Active
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Variants</h3>
            <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleAddVariant}>
              Add Variant
            </Button>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
            {variants.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
                No variants added yet.
              </div>
            )}
            
            {variants.map((variant, index) => (
              <div key={variant.id} className="relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center">
                <button
                  onClick={() => handleRemoveVariant(variant.id, (variant as any)._isNew)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-600 shadow-sm hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900"
                >
                  <X size={14} />
                </button>

                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Variant Name (e.g. 1.5 MPI MT EX)"
                    value={variant.name}
                    onChange={(e) => handleUpdateVariant(index, "name", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                
                <div className="flex gap-2 sm:w-auto">
                  <select
                    value={variant.transmissionType}
                    onChange={(e) => handleUpdateVariant(index, "transmissionType", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="AUTOMATIC">Automatic</option>
                  </select>
                  
                  <select
                    value={variant.fuelType}
                    onChange={(e) => handleUpdateVariant(index, "fuelType", e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="CNG_PETROL">CNG/Petrol</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>

                  {isEditing && !(variant as any)._isNew && (
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 ml-2">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(e) => handleUpdateVariant(index, "isActive", e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-900"
                      />
                      Active
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
          {isEditing ? (
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDeleteModel} disabled={isSaving}>
              Delete Model
            </Button>
          ) : (
            <div />
          )}
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {isEditing ? "Save Changes" : "Create Vehicle"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
