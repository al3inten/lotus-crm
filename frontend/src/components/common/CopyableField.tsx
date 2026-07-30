import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyableField({ label, value }: { label?: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs font-semibold text-gray-600">{label}</span>}
      <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
        <code className="min-w-0 flex-1 truncate text-xs text-gray-700">{value}</code>
        <button type="button" onClick={handleCopy} className="shrink-0 text-gray-400 hover:text-gray-700">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}
