import { prisma } from "../../lib/prisma";
import { maybeReplyToConversation } from "./chatbotReply.service";

interface InstagramMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text?: string };
}

/**
 * Instagram's Messaging API never exposes a phone number for the sender (only an
 * Instagram-scoped ID), so unlike WhatsApp/Meta Lead Ads we cannot auto-create a Lead —
 * our dedup model is keyed on phone. These land in the Social Inbox for a CR team member
 * to convert once they've obtained the customer's phone number in the conversation.
 */
export async function handleIncomingMessaging(events: InstagramMessagingEvent[]) {
  for (const event of events) {
    if (!event.message?.text) continue;

    const igsid = event.sender.id;

    const conversation = await prisma.conversation.upsert({
      where: { channel_externalContactId: { channel: "INSTAGRAM", externalContactId: igsid } },
      update: {},
      create: { channel: "INSTAGRAM", externalContactId: igsid },
    });

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        body: event.message.text,
        externalMessageId: event.message.mid,
      },
    });

    await maybeReplyToConversation(conversation);
  }
}
