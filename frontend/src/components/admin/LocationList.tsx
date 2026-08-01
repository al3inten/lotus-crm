import { useEffect, useState } from "react";
import { MapPin, Pencil, Trash2, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import type { BranchLocation } from "../../types";
import { useUpdateLocation, useDeleteLocation } from "../../hooks/useBranchLocations";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { Toggle } from "../common/Toggle";
import { Card } from "../common/Card";

function EditLocationModal({ location, isOpen, onClose }: { location: BranchLocation; isOpen: boolean; onClose: () => void }) {
  const updateLocation = useUpdateLocation();
  const [name, setName] = useState(location.name);
  const [state, setState] = useState(location.state ?? "");
  const [isActive, setIsActive] = useState(location.isActive);

  useEffect(() => {
    setName(location.name);
    setState(location.state ?? "");
    setIsActive(location.isActive);
  }, [location, isOpen]);

  const handleSave = () => {
    updateLocation.mutate(
      { locationId: location.id, payload: { name, state: state || undefined, isActive } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Location — ${location.name}`}>
      <div className="flex flex-col gap-3">
        <Input label="Location Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="State (optional)" value={state} onChange={(e) => setState(e.target.value)} />
        <div className="rounded-lg border border-gray-200 p-3">
          <Toggle label="Active" checked={isActive} onChange={setIsActive} />
        </div>
        {updateLocation.isError && <p className="text-sm text-red-600">Failed to save changes.</p>}
        <div className="mt-1 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={updateLocation.isPending} disabled={!name} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function LocationList({ locations }: { locations: BranchLocation[] }) {
  const deleteLocation = useDeleteLocation();
  const [editing, setEditing] = useState<BranchLocation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<BranchLocation | null>(null);

  const confirmDelete = () => {
    if (!locationToDelete) return;
    setDeleteError(null);
    deleteLocation.mutate(locationToDelete.id, {
      onSuccess: () => setLocationToDelete(null),
      onError: (err) => {
        const message =
          (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
          "Could not delete this location.";
        setDeleteError(message);
        setLocationToDelete(null);
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {deleteError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">{deleteError}</p>
      )}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {locations.map((location) => (
          <Card key={location.id} padded={false} className={clsx("p-4", !location.isActive && "opacity-60")}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {location.name}
                    {!location.isActive && <span className="ml-2 text-xs font-medium text-gray-400">(inactive)</span>}
                  </p>
                  {location.state && <p className="text-xs text-gray-500">{location.state}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  onClick={() => setEditing(location)}
                  aria-label="Edit location"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setLocationToDelete(location)}
                  aria-label="Delete location"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {editing && <EditLocationModal location={editing} isOpen={!!editing} onClose={() => setEditing(null)} />}

      <Modal isOpen={!!locationToDelete} onClose={() => setLocationToDelete(null)} title="">
        <div className="flex flex-col gap-4 py-2 sm:p-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-semibold leading-6 text-slate-900">Delete {locationToDelete?.name}?</h3>
            <div className="mt-2">
              <p className="text-sm text-slate-500">
                Are you sure? This is only possible when the location has no branches assigned to it.
              </p>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse sm:gap-3">
            <Button variant="danger" isLoading={deleteLocation.isPending} onClick={confirmDelete} className="w-full sm:w-auto">
              Delete
            </Button>
            <Button variant="secondary" onClick={() => setLocationToDelete(null)} className="mt-3 w-full sm:mt-0 sm:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
