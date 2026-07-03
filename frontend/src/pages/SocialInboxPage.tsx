import { useState } from "react";
import { useConversations, useConversation, useIgnoreConversation } from "../hooks/useSocialInbox";
import { ConversationList } from "../components/social-inbox/ConversationList";
import { ConversationThread } from "../components/social-inbox/ConversationThread";
import { ConvertToLeadModal } from "../components/social-inbox/ConvertToLeadModal";
import { Button } from "../components/common/Button";
import type { SocialChannel } from "../api/socialInbox.api";

export function SocialInboxPage() {
  const [channel, setChannel] = useState<SocialChannel | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [showConvert, setShowConvert] = useState(false);

  const { data: conversations, isLoading } = useConversations({ channel, onlyUnresolved: true });
  const { data: conversation } = useConversation(selectedId);
  const ignoreConversation = useIgnoreConversation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Social Inbox</h1>
          <p className="text-sm text-gray-500">
            Instagram DMs land here since Instagram never gives us a phone number — convert to a lead once you have
            one from the conversation. WhatsApp messages become leads automatically and appear in Leads directly.
          </p>
        </div>
        <div className="flex gap-2">
          {(["INSTAGRAM", "WHATSAPP"] as SocialChannel[]).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(channel === c ? undefined : c)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                channel === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <ConversationList conversations={conversations ?? []} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>

        <div className="lg:col-span-2">
          {conversation ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                <span className="text-sm font-semibold text-gray-900">
                  {conversation.contactName || conversation.externalContactId}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => ignoreConversation.mutate(conversation.id)}>
                    Ignore
                  </Button>
                  <Button onClick={() => setShowConvert(true)}>Convert to Lead</Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <ConversationThread conversation={conversation} />
              </div>
              <ConvertToLeadModal
                conversationId={conversation.id}
                suggestedName={conversation.contactName ?? undefined}
                isOpen={showConvert}
                onClose={() => setShowConvert(false)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select a conversation to view its history.</p>
          )}
        </div>
      </div>
    </div>
  );
}
