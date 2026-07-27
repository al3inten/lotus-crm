import clsx from "clsx";
import type { Conversation } from "../../api/socialInbox.api";

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  if (conversations.length === 0) {
    return <p className="p-4 text-sm text-gray-400">No unresolved conversations right now.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            onClick={() => onSelect(c.id)}
            className={clsx(
              "w-full rounded-md border p-3 text-left text-sm",
              selectedId === c.id ? "border-primary-400 bg-primary-50" : "border-gray-200 bg-white hover:bg-gray-50"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{c.contactName || c.externalContactId}</span>
              <span className="text-xs text-gray-400">{c.channel}</span>
            </div>
            {c.messages[0] && <p className="mt-1 truncate text-xs text-gray-500">{c.messages[0].body}</p>}
          </button>
        </li>
      ))}
    </ul>
  );
}
