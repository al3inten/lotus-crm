import clsx from "clsx";
import type { Conversation } from "../../api/socialInbox.api";

export function ConversationThread({ conversation }: { conversation: Conversation }) {
  if (conversation.messages.length === 0) {
    return <p className="text-sm text-gray-400">No messages yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {conversation.messages.map((message) => (
        <div
          key={message.id}
          className={clsx(
            "max-w-[75%] rounded-lg px-3 py-2 text-sm",
            message.direction === "INBOUND" ? "self-start bg-gray-100 text-gray-800" : "self-end bg-blue-600 text-white"
          )}
        >
          <p>{message.body}</p>
          <p className={clsx("mt-1 text-[10px]", message.direction === "INBOUND" ? "text-gray-400" : "text-blue-100")}>
            {new Date(message.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
