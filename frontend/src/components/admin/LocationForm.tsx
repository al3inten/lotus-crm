import { useState } from "react";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { useCreateLocation } from "../../hooks/useBranchLocations";

export function LocationForm({ onSuccess }: { onSuccess: () => void }) {
  const createLocation = useCreateLocation();
  const [name, setName] = useState("");
  const [state, setState] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await createLocation.mutateAsync({ name, state: state || undefined });
    setName("");
    setState("");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input label="Location Name" placeholder="e.g. Chennai" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="State (optional)" placeholder="e.g. Tamil Nadu" value={state} onChange={(e) => setState(e.target.value)} />
      <Button type="submit" isLoading={createLocation.isPending} disabled={!name}>
        Create Location
      </Button>
    </form>
  );
}
