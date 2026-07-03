import { GoogleGenAI, Type, FunctionCallingConfigMode } from "@google/genai";
import { AgentType, Conversation } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import * as integrationsService from "../integrations/integrations.service";
import * as whatsappSend from "./whatsappSend.service";
import * as instagramSend from "./instagramSend.service";

const AGENT_TYPE_BY_CHANNEL: Record<"WHATSAPP" | "INSTAGRAM", AgentType> = {
  WHATSAPP: "WHATSAPP_CHATBOT",
  INSTAGRAM: "INSTAGRAM_CHATBOT",
};

const SEARCH_MEDIA_TOOL = {
  name: "search_media_assets",
  description: "Find a car photo, video, or brochure to send to the customer, filtered by car model.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      carModel: { type: Type.STRING, description: "The car model to find media for, e.g. 'Creta'" },
    },
    required: ["carModel"],
  },
};

const HISTORY_LIMIT = 20;

async function loadHistory(conversationId: string) {
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  return messages.reverse();
}

async function sendReply(conversation: Conversation, text?: string, mediaUrl?: string, mediaType?: "image" | "video") {
  if (conversation.channel === "WHATSAPP") {
    if (mediaUrl && mediaType) {
      await whatsappSend.sendMediaMessage(conversation.externalContactId, mediaUrl, mediaType, text);
    } else if (text) {
      await whatsappSend.sendTextMessage(conversation.externalContactId, text);
    }
  } else if (conversation.channel === "INSTAGRAM") {
    if (mediaUrl && mediaType) {
      await instagramSend.sendMediaMessage(conversation.externalContactId, mediaUrl, mediaType);
      if (text) await instagramSend.sendTextMessage(conversation.externalContactId, text);
    } else if (text) {
      await instagramSend.sendTextMessage(conversation.externalContactId, text);
    }
  }

  await prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "OUTBOUND",
      body: text ?? "[media]",
      mediaUrl,
    },
  });
}

/**
 * Runs after a WhatsApp/Instagram inbound message has already been logged. If the matching
 * chatbot AgentConfig is active, generates a reply with Gemini (with a media-search tool so
 * the bot can attach a relevant car photo/video/brochure) and sends it back on the same channel.
 */
export async function maybeReplyToConversation(conversation: Conversation) {
  if (conversation.channel !== "WHATSAPP" && conversation.channel !== "INSTAGRAM") return;

  const agentConfig = await prisma.agentConfig.findUnique({
    where: { type: AGENT_TYPE_BY_CHANNEL[conversation.channel] },
  });
  if (!agentConfig?.isActive) return;

  let geminiApiKey: string;
  try {
    geminiApiKey = (await integrationsService.getGeminiCredentials()).apiKey;
  } catch {
    logger.warn("Chatbot is active but Gemini is not configured", { conversationId: conversation.id });
    return;
  }

  const history = await loadHistory(conversation.id);
  const contents = history.map((m) => ({
    role: m.direction === "INBOUND" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.body }],
  }));

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  try {
    const first = await ai.models.generateContent({
      model: agentConfig.model,
      contents,
      config: {
        systemInstruction: agentConfig.systemPrompt,
        tools: [{ functionDeclarations: [SEARCH_MEDIA_TOOL] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
      },
    });

    const functionCall = first.functionCalls?.[0];

    if (functionCall?.name === "search_media_assets") {
      const carModel = String(functionCall.args?.carModel ?? "");
      const asset = await prisma.mediaAsset.findFirst({
        where: { carModel: { contains: carModel, mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
      });

      const second = await ai.models.generateContent({
        model: agentConfig.model,
        contents: [
          ...contents,
          { role: "model" as const, parts: [{ functionCall }] },
          {
            role: "user" as const,
            parts: [
              {
                functionResponse: {
                  name: "search_media_assets",
                  response: asset ? { found: true, label: asset.label } : { found: false },
                },
              },
            ],
          },
        ],
        config: { systemInstruction: agentConfig.systemPrompt },
      });

      const replyText = second.text?.trim();
      if (asset) {
        await sendReply(conversation, replyText, asset.cloudinaryUrl, asset.mediaType === "VIDEO" ? "video" : "image");
      } else if (replyText) {
        await sendReply(conversation, replyText);
      }
      return;
    }

    const replyText = first.text?.trim();
    if (replyText) {
      await sendReply(conversation, replyText);
    }
  } catch (err) {
    logger.error("Chatbot reply generation failed", {
      conversationId: conversation.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
