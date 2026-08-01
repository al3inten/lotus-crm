import { useState } from "react";
import { Loader2, Pencil, PhoneCall, Send } from "lucide-react";
import { Modal } from "../common/Modal";
import { useCallLogsForLead } from "../../hooks/useVoice";
import { useNotes, useAddNote } from "../../hooks/useEnquiry";
import type { CallLog } from "../../api/voice.api";

function CallEntry({ call }: { call: CallLog }) {
  const recordingExpired = !!call.recordingExpiresAt && new Date(call.recordingExpiresAt).getTime() < Date.now();
  const showRecording = !!call.recordingUrl && !recordingExpired;
  const showExpiredNote = !!call.recordingUrl && recordingExpired && !!call.transcript;

  return (
    <li className="rounded-lg bg-slate-50 p-2.5 text-sm dark:bg-slate-800/60">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-800 dark:text-slate-200">{call.status.replaceAll("_", " ")}</span>
        <span className="text-slate-400 dark:text-slate-500">{new Date(call.createdAt).toLocaleString()}</span>
      </div>

      {showRecording && <audio controls src={call.recordingUrl!} className="mt-1.5 h-8 w-full" />}
      {showExpiredNote && (
        <p className="mt-1.5 text-xs italic text-slate-400 dark:text-slate-500">
          Recording expired (available for 30 days) — transcript only.
        </p>
      )}

      {call.transcriptStatus === "PENDING" && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Transcribing…</p>
      )}
      {call.transcriptStatus === "FAILED" && !call.transcript && (
        <p className="mt-1.5 text-xs text-red-500">Transcription failed.</p>
      )}
      {call.transcript && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 dark:text-slate-400">Transcript</summary>
          <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">{call.transcript}</p>
        </details>
      )}
      {!call.recordingUrl && !call.transcript && (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">No recording available.</p>
      )}
    </li>
  );
}

function NotesSection({ enquiryId }: { enquiryId: string }) {
  const { data: notes = [], isLoading } = useNotes(enquiryId);
  const addNote = useAddNote(enquiryId);
  const [draft, setDraft] = useState("");

  const submit = () => {
    const body = draft.trim();
    if (!body || addNote.isPending) return;
    addNote.mutate({ body }, { onSuccess: () => setDraft("") });
  };

  return (
    <div className="flex flex-col gap-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-4 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : notes.length > 0 ? (
        <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-100">
              <p className="whitespace-pre-wrap">{note.body}</p>
              <p className="mt-1 text-[10px] text-emerald-700/70 dark:text-emerald-300/60">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-1.5 py-2 text-xs text-slate-400 dark:text-slate-500">
          <Pencil size={13} /> No notes yet — private to you.
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          placeholder="Add a note…"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="block w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          disabled={!draft.trim() || addNote.isPending}
          onClick={submit}
          aria-label="Add note"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-40"
        >
          {addNote.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}

/**
 * Opened by clicking a lead's phone number anywhere (lead detail page, leads list) — shows
 * every call recorded against that lead (recording + transcript, from the AI dialer or
 * FasterQ) plus the CR's private notes for the current enquiry, side by side.
 */
export function CallHistoryModal({
  isOpen,
  onClose,
  leadId,
  enquiryId,
  phone,
}: {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  enquiryId?: string;
  phone: string;
}) {
  const { data: callLogs, isLoading } = useCallLogsForLead(isOpen ? leadId : undefined);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Calls & Notes — ${phone}`} maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <PhoneCall size={13} /> Call History
          </h4>
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          ) : callLogs && callLogs.length > 0 ? (
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {callLogs.map((call) => (
                <CallEntry key={call.id} call={call} />
              ))}
            </ul>
          ) : (
            <p className="py-2 text-xs text-slate-400 dark:text-slate-500">No calls recorded for this lead yet.</p>
          )}
        </div>

        {enquiryId && (
          <div className="border-t border-slate-100 pt-3 dark:border-slate-700/60">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Pencil size={13} /> Notes
            </h4>
            <NotesSection enquiryId={enquiryId} />
          </div>
        )}
      </div>
    </Modal>
  );
}
