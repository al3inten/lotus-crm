import { Modal } from "../../common/Modal";
import { Button } from "../../common/Button";

interface ConfirmCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isComplete: boolean;
}

export function ConfirmCloseModal({ isOpen, onClose, onConfirm, isComplete }: ConfirmCloseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="mt-2 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-50 dark:bg-amber-500/20 dark:ring-amber-500/10">
          <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Discard Changes?</h3>
        <p className="mb-6 px-2 text-sm text-slate-500 dark:text-slate-400">
          Are you sure you want to close this form? Any unsaved data will be permanently lost
          {!isComplete && " (unless you Save as Draft first)"}.
        </p>
      </div>
      <div className="flex w-full gap-3">
        <Button type="button" variant="secondary" className="flex-1 justify-center" onClick={onClose}>
          No, keep editing
        </Button>
        <Button type="button" variant="danger" className="flex-1 justify-center shadow-md shadow-rose-500/20" onClick={onConfirm}>
          Yes, discard
        </Button>
      </div>
    </Modal>
  );
}
