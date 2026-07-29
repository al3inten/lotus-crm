import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getSystemUserId } from "../../lib/systemUser";
import { normalizePhone } from "../leads/phone.util";
import * as leadsService from "../leads/leads.service";
import { maybeReplyToConversation } from "./chatbotReply.service";

interface WhatsappMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

interface WhatsappContact {
  wa_id: string;
  profile?: { name?: string };
}

interface WhatsappChangeValue {
  contacts?: WhatsappContact[];
  messages?: WhatsappMessage[];
}

async function resolveDefaultBranchId(): Promise<string> {
  const branch = await prisma.branch.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (!branch) throw new Error("No active branch exists to route WhatsApp leads into");
  return branch.id;
}

export async function handleIncomingMessages(value: WhatsappChangeValue) {
  if (!value.messages?.length) return;

  for (const message of value.messages) {
    const phoneNormalized = normalizePhone(message.from);
    const contactName = value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name ?? "WhatsApp Lead";
    const body = message.text?.body ?? `[${message.type} message]`;

    let conversation = await prisma.conversation.findUnique({
      where: { channel_externalContactId: { channel: "WHATSAPP", externalContactId: phoneNormalized } },
    });

    if (!conversation) {
      const systemUserId = await getSystemUserId();
      const { lead } = await leadsService.createOrAttachEnquiry(
        {
          name: contactName,
          phone: message.from,
          carModel: "To be determined",
          source: "WHATSAPP",
          enquiryType: "OTHER",
          branchId: await resolveDefaultBranchId(),
        },
        systemUserId,
        { allowAttach: true }
      );

      // Two webhook deliveries for the same brand-new contact can interleave and both reach
      // here with conversation === null; the loser's create hits the unique
      // (channel, externalContactId) constraint. Fall back to the winner's row instead of
      // throwing, so this message still gets recorded against the same conversation.
      try {
        conversation = await prisma.conversation.create({
          data: {
            channel: "WHATSAPP",
            externalContactId: phoneNormalized,
            contactName,
            leadId: lead.id,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          conversation = await prisma.conversation.findUniqueOrThrow({
            where: { channel_externalContactId: { channel: "WHATSAPP", externalContactId: phoneNormalized } },
          });
        } else {
          throw err;
        }
      }
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        body,
        externalMessageId: message.id,
      },
    });

    await maybeReplyToConversation(conversation);
  }
}
