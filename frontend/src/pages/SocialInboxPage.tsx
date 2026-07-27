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
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B0F19] px-6 py-8 shadow-2xl shadow-primary-900/10 ring-1 ring-slate-900/5 dark:bg-slate-950 dark:ring-white/10 sm:px-9 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h1v1H0V0zm23 23h1v1h-1v-1z' fill='white'/%3E%3C/svg%3E\")", backgroundSize: "24px 24px" }}
        />
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-primary-500/10 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-primary-300 ring-1 ring-inset ring-primary-500/20 backdrop-blur-md">
              Engagement Center
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Social Inbox
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Manage Instagram DMs and convert promising conversations into CRM leads.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setChannel(channel === "INSTAGRAM" ? undefined : "INSTAGRAM")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            channel === "INSTAGRAM"
              ? "bg-pink-500 text-white shadow-md"
              : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          Instagram
        </button>
        
        <button
          onClick={() => setChannel(channel === "WHATSAPP" ? undefined : "WHATSAPP")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            channel === "WHATSAPP"
              ? "bg-[#25D366] text-white shadow-md"
              : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          WhatsApp
        </button>
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
