import { useState } from "react";
import { Copy, Check } from "lucide-react";
import clsx from "clsx";

/** Small inline copy-to-clipboard button with a brief "copied" confirmation. */
export function CopyButton({ value, label, className }: { value?: string | null; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : (label ?? "Copy")}
      className={clsx(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 dark:hover:bg-slate-800 dark:hover:text-slate-200",
        className
      )}
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}
