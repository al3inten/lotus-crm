import { useState, useRef, useEffect } from "react";
import { AtSign, Send } from "lucide-react";
import { useBranchStaff } from "../../hooks/useUsers";
import { useAuth } from "../../context/AuthContext";
import { useAddComment } from "../../hooks/useEnquiry";
import { Button } from "../common/Button";

export function CommentInput({ enquiryId }: { enquiryId: string }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: staff } = useBranchStaff(user?.branch?.id);
  const { mutate: addComment, isPending } = useAddComment(enquiryId);

  // Close mention dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMentionOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMention = (userId: string, userName: string) => {
    if (!mentionedUserIds.includes(userId)) {
      setMentionedUserIds((prev) => [...prev, userId]);
    }
    setBody((prev) => prev + (prev.endsWith(" ") || prev.length === 0 ? "" : " ") + `@${userName} `);
    setIsMentionOpen(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isPending) return;

    addComment(
      { body, mentionedUserIds },
      {
        onSuccess: () => {
          setBody("");
          setMentionedUserIds([]);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="relative mt-4 mb-8 flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment or note..."
        className="block w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
      />

      <div className="flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsMentionOpen(!isMentionOpen)}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <AtSign size={14} />
            <span>Mention</span>
          </button>

          {isMentionOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 z-10">
              <div className="max-h-48 overflow-y-auto">
                {staff?.filter(s => s.id !== user?.id).map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleMention(member.id, member.name)}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50 rounded-lg"
                  >
                    {member.name}
                  </button>
                ))}
                {(!staff || staff.length <= 1) && (
                  <p className="p-3 text-center text-xs text-slate-500">No other team members found.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={!body.trim() || isPending}
          className="h-8 gap-1.5 px-3 py-0 text-xs"
        >
          <Send size={14} />
          {isPending ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  );
}
