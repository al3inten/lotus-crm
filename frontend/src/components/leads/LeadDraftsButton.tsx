import { useState } from "react";
import { FileEdit, Trash2 } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { useDrafts, useDeleteDraft } from "../../hooks/useLeads";
import type { LeadDraft } from "../../types";

export function LeadDraftsButton({ onResume }: { onResume: (draft: LeadDraft) => void }) {
  const { data: drafts } = useDrafts();
  const deleteDraft = useDeleteDraft();
  const [isOpen, setIsOpen] = useState(false);

  if (!drafts || drafts.length === 0) return null;

  const draftLabel = (draft: LeadDraft) => {
    const name = typeof draft.data.name === "string" && draft.data.name ? draft.data.name : "Unnamed customer";
    const carModel = typeof draft.data.carModel === "string" && draft.data.carModel ? draft.data.carModel : null;
    return carModel ? `${name} · ${carModel}` : name;
  };

  return (
    <>
      <Button variant="secondary" icon={<FileEdit size={14} />} onClick={() => setIsOpen(true)}>
        Drafts ({drafts.length})
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Saved Drafts" maxWidth="max-w-md">
        <ul className="flex flex-col gap-2">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-200">{draftLabel(draft)}</p>
                <p className="text-xs text-slate-400">{new Date(draft.updatedAt).toLocaleString()}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onResume(draft);
                    setIsOpen(false);
                  }}
                >
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Discard draft"
                  isLoading={deleteDraft.isPending}
                  onClick={() => deleteDraft.mutate(draft.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
