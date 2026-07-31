import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { fetchCustomerPreview, downloadEnquiriesXlsx } from "../../api/reports.api";
import type { ReportFilters } from "../../api/reports.api";
import { STATUS_LABELS } from "../../types";

const PAGE_SIZE = 20;

/**
 * Every "download this list" action on the Reports page goes through here first — shows
 * who actually matches the filters before committing to a file, instead of downloading
 * blind. The Excel it produces is exactly this same filtered set (no pagination — the
 * export endpoint has its own 10k row cap).
 */
export function CustomerListModal({
  isOpen,
  onClose,
  title,
  filters,
  fileSuffix,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  filters: ReportFilters;
  fileSuffix: string;
}) {
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "customers", filters, page],
    queryFn: () => fetchCustomerPreview(filters, page, PAGE_SIZE),
    enabled: isOpen,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await downloadEnquiriesXlsx(filters);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lotus-crm-customers-${fileSuffix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Customer list exported");
    } catch (err) {
      let message = "Something went wrong";
      if (isAxiosError(err) && err.response?.data instanceof Blob) {
        try {
          message = (JSON.parse(await err.response.data.text()) as { error?: string }).error ?? message;
        } catch {
          // leave the generic message
        }
      }
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setPage(1);
        onClose();
      }}
      title={title}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {data ? `${data.total.toLocaleString()} customer${data.total === 1 ? "" : "s"} match` : "Loading…"}
          </span>
          <Button icon={<Download size={15} />} isLoading={downloading} disabled={!data || data.total === 0} onClick={handleDownload}>
            Download Excel
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
      ) : !data || data.rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No customers match these filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Phone</th>
                  <th className="px-3 py-2.5">Vehicle</th>
                  <th className="px-3 py-2.5">Source</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Branch</th>
                  <th className="px-3 py-2.5">Assigned CR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {data.rows.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-primary-50/60 dark:hover:bg-primary-500/[0.06]">
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-slate-100">{row.name}</td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-slate-300">{row.phone}</td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-slate-300">{row.carModel}</td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-slate-300">{row.source.replaceAll("_", " ")}</td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-slate-300">
                      {STATUS_LABELS[row.status as keyof typeof STATUS_LABELS] ?? row.status}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-slate-300">{row.branch}</td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-slate-300">{row.assignedCr ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
