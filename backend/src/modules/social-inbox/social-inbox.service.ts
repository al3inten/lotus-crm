import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError, ValidationError } from "../../lib/errors";
import * as leadsService from "../leads/leads.service";
import { ConvertConversationInput, ListConversationsQuery } from "./social-inbox.schema";

export async function listConversations(query: ListConversationsQuery) {
  const where: Prisma.ConversationWhereInput = { isIgnored: false };
  if (query.channel) where.channel = query.channel;
  if (query.onlyUnresolved) where.leadId = null;

  return prisma.conversation.findMany({
    where,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      lead: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversation(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      lead: { select: { id: true, name: true } },
    },
  });
  if (!conversation) throw new NotFoundError("Conversation not found");
  return conversation;
}

export async function convertToLead(conversationId: string, input: ConvertConversationInput, convertedById: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new NotFoundError("Conversation not found");
  if (conversation.leadId) throw new ValidationError("This conversation is already linked to a lead");

  const { lead } = await leadsService.createOrAttachEnquiry(
    {
      name: input.name,
      phone: input.phone,
      email: input.email,
      carModel: input.carModel,
      source: conversation.channel === "INSTAGRAM" ? "INSTAGRAM" : "WHATSAPP",
      enquiryType: input.enquiryType,
      location: input.location,
      branchId: input.branchId,
    },
    convertedById,
    { allowAttach: true }
  );

  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      leadId: lead.id,
      convertedById,
      convertedAt: new Date(),
      contactName: conversation.contactName ?? input.name,
    },
  });
}

export async function ignoreConversation(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) throw new NotFoundError("Conversation not found");
  return prisma.conversation.update({ where: { id: conversationId }, data: { isIgnored: true } });
}
