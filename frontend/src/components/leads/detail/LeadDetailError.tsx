import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "../../common/Button";

export function LeadDetailError({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-400 dark:border-white/[0.07] dark:bg-[#0E1015] dark:text-slate-500">
        <AlertCircle size={20} strokeWidth={1.75} />
      </span>
      <div>
        <h1 className="text-[17px] font-semibold tracking-tight text-slate-900 dark:text-white">
          Couldn't load this lead
        </h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          It may have been removed, or you don't have access to it.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
        <Button icon={<ArrowLeft size={14} />} onClick={onBack}>
          Back to leads
        </Button>
      </div>
    </div>
  );
}
