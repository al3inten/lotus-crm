import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import type { VehicleModel, VehicleVariant } from "../../types";
import { TRANSMISSION_TYPES, FUEL_TYPES } from "../../types";
import { vehicleVariantFormSchema } from "../../schemas/vehicle.schema";
import type { VehicleVariantFormValues } from "../../schemas/vehicle.schema";
import {
  useUpdateVehicleModel,
  useDeleteVehicleModel,
  useCreateVehicleVariant,
  useUpdateVehicleVariant,
  useDeleteVehicleVariant,
} from "../../hooks/useVehicles";
import { Modal } from "../common/Modal";
import { Input, Select } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { Card } from "../common/Card";

function fuelLabel(fuel: string) {
  return fuel.replaceAll("_", " + ");
}

function EditModelModal({ model, isOpen, onClose }: { model: VehicleModel; isOpen: boolean; onClose: () => void }) {
  const updateModel = useUpdateVehicleModel();
  const [name, setName] = useState(model.name);
  const [isActive, setIsActive] = useState(model.isActive);

  useEffect(() => {
    setName(model.name);
    setIsActive(model.isActive);
  }, [model, isOpen]);

  const handleSave = () => {
    updateModel.mutate({ modelId: model.id, payload: { name, isActive } }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Model — ${model.name}`}>
      <div className="flex flex-col gap-3">
        <Input label="Model Name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="rounded-lg border border-gray-200 p-3">
          <Toggle
            label="Active"
            description="Inactive models are hidden from the Add Lead dropdown"
            checked={isActive}
            onChange={setIsActive}
          />
        </div>
        {updateModel.isError && <p className="text-sm text-red-600">Failed to save changes.</p>}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={updateModel.isPending} disabled={!name} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function VariantFormModal({
  modelId,
  existing,
  isOpen,
  onClose,
}: {
  modelId: string;
  existing?: VehicleVariant | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const createVariant = useCreateVehicleVariant();
  const updateVariant = useUpdateVehicleVariant();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleVariantFormValues>({
    resolver: zodResolver(vehicleVariantFormSchema),
    defaultValues: { name: "", transmissionType: "MANUAL", fuelType: "PETROL" },
  });

  useEffect(() => {
    reset(
      existing
        ? { name: existing.name, transmissionType: existing.transmissionType, fuelType: existing.fuelType }
        : { name: "", transmissionType: "MANUAL", fuelType: "PETROL" }
    );
  }, [existing, isOpen, reset]);

  const onSubmit = async (values: VehicleVariantFormValues) => {
    if (existing) {
      await updateVariant.mutateAsync({ variantId: existing.id, payload: values });
    } else {
      await createVariant.mutateAsync({ modelId, payload: values });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existing ? "Edit Variant" : "Add Variant"} maxWidth="max-w-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Input label="Variant Name" placeholder="e.g. 1.2 MT" error={errors.name?.message} {...register("name")} />
        <Select label="Transmission" error={errors.transmissionType?.message} {...register("transmissionType")}>
          {TRANSMISSION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select label="Fuel Type" error={errors.fuelType?.message} {...register("fuelType")}>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>
              {fuelLabel(f)}
            </option>
          ))}
        </Select>
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {existing ? "Save" : "Add Variant"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function VehicleModelList({ models }: { models: VehicleModel[] }) {
  const deleteModel = useDeleteVehicleModel();
  const deleteVariant = useDeleteVehicleVariant();
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [modelToDelete, setModelToDelete] = useState<VehicleModel | null>(null);
  const [variantModal, setVariantModal] = useState<{ modelId: string; variant?: VehicleVariant } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDeleteModel = () => {
    if (!modelToDelete) return;
    setDeleteError(null);
    deleteModel.mutate(modelToDelete.id, {
      onSuccess: () => setModelToDelete(null),
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          "Could not delete this model.";
        setDeleteError(message);
        setModelToDelete(null);
      },
    });
  };

  const handleDeleteVariant = (variant: VehicleVariant) => {
    if (!window.confirm(`Delete variant "${variant.name}"?`)) return;
    deleteVariant.mutate(variant.id);
  };

  if (models.length === 0) {
    return <p className="text-sm text-gray-500">No vehicle models yet — add one above.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {deleteError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{deleteError}</p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {models.map((model) => (
          <Card key={model.id} padded={false} className={clsx("p-4", !model.isActive && "opacity-60")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Car size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {model.name}
                    {!model.isActive && <span className="ml-2 text-xs font-medium text-gray-400">(inactive)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{model.variants.length} variant(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => setEditingModel(model)}
                  aria-label="Edit model"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setModelToDelete(model)}
                  aria-label="Delete model"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1.5 border-t border-gray-100 pt-3">
              {model.variants.map((variant) => (
                <div
                  key={variant.id}
                  className={clsx(
                    "flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-xs",
                    !variant.isActive && "opacity-50"
                  )}
                >
                  <span className="text-gray-800">
                    {variant.name} · {variant.transmissionType} · {fuelLabel(variant.fuelType)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      onClick={() => setVariantModal({ modelId: model.id, variant })}
                      aria-label={`Edit ${variant.name}`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleDeleteVariant(variant)}
                      aria-label={`Delete ${variant.name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {model.variants.length === 0 && <p className="text-xs text-gray-400">No variants yet.</p>}
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                className="mt-1 w-fit"
                onClick={() => setVariantModal({ modelId: model.id })}
              >
                Add Variant
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {editingModel && <EditModelModal model={editingModel} isOpen={!!editingModel} onClose={() => setEditingModel(null)} />}

      {variantModal && (
        <VariantFormModal
          modelId={variantModal.modelId}
          existing={variantModal.variant}
          isOpen={!!variantModal}
          onClose={() => setVariantModal(null)}
        />
      )}

      <Modal isOpen={!!modelToDelete} onClose={() => setModelToDelete(null)} title="">
        <div className="flex flex-col gap-4 py-2 sm:p-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-semibold leading-6 text-slate-900">Delete {modelToDelete?.name}?</h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500">
                This removes the model and all {modelToDelete?.variants.length ?? 0} of its variants from the
                catalog. Existing leads/enquiries already using this model are unaffected — they keep their own
                saved text.
              </p>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
            <Button variant="danger" isLoading={deleteModel.isPending} onClick={confirmDeleteModel} className="w-full sm:w-auto">
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setModelToDelete(null)} className="mt-3 w-full sm:mt-0 sm:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
