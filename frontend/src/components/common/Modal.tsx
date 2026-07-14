import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: string;
  children: ReactNode;
  /** Optional action bar rendered outside the scrollable body, pinned to the panel's
   * bottom edge for the life of the modal — never overlapped by scrolling content. */
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, maxWidth = "max-w-lg", children, footer }: ModalProps) {
  if (!isOpen) return null;

  // Portaled to <body> so a `transform` or `overflow-hidden` on an ancestor (e.g. a
  // hovered interactive Card) can't turn into a containing block that clips or traps
  // this fixed-position overlay inside the ancestor's box.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className={clsx("relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl shadow-2xl bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]", maxWidth)}>
        <div className="modal-scroll flex-1 overflow-y-auto p-7">
          {title && (
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors" aria-label="Close">
                ✕
              </button>
            </div>
          )}
          {!title && (
            <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors" aria-label="Close">
              ✕
            </button>
          )}
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-7 py-4 dark:border-slate-800 dark:bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
