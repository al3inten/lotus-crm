import { CallOutcome, EnquiryResponse, NextAction, OutboundCallTask } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";

// Callmatic's exact vocabulary for call outcome/intent isn't documented anywhere — these
// mappings are a best-effort guess at likely field/value names. Verify against real
// payloads (logged by the webhook/poller) and adjust once confirmed.
function mapCallOutcome(status: string | undefined): CallOutcome | undefined {
  switch (status?.toLowerCase()) {
    case "completed":
    case "answered":
      return "ANSWERED";
    case "no-answer":
    case "no_answer":
    case "noanswer":
      return "NO_ANSWER";
    case "busy":
      return "BUSY";
    default:
      return undefined;
  }
}

function mapResponse(insights: any[] | undefined): EnquiryResponse | undefined {
  const intent = insights
    ?.find((i) => ["CLASSIFY", "INTENT", "CLASSIFY_INTENT"].includes(i?.actionType))
    ?.output?.intent?.toLowerCase();

  switch (intent) {
    case "interested":
      return "INTERESTED";
    case "not_interested":
    case "not-interested":
      return "NOT_INTERESTED";
    case "callback":
      return "CALLBACK";
    case "follow_up":
    case "follow-up":
      return "FOLLOW_UP";
    default:
      return undefined;
  }
}

function deriveNextAction(callOutcome: CallOutcome | undefined, response: EnquiryResponse | undefined): NextAction {
  if (callOutcome === "NO_ANSWER" || callOutcome === "BUSY") return "RETRY_CALL";
  switch (response) {
    case "INTERESTED":
      return "ASSIGN_TO_CR";
    case "NOT_INTERESTED":
      return "MARK_LOST";
    case "CALLBACK":
      return "SCHEDULE_CALLBACK";
    case "FOLLOW_UP":
      return "SCHEDULE_FOLLOW_UP";
    default:
      return "RETRY_CALL";
  }
}

// The statuses Callmatic can report that mean "the call is over, nothing more will change".
const TERMINAL_STATUSES = new Set(["completed", "answered", "no-answer", "no_answer", "noanswer", "busy", "failed"]);

export function isTerminalCallStatus(status: string | undefined): boolean {
  return !!status && TERMINAL_STATUSES.has(status.toLowerCase());
}

export interface CallResultPayload {
  callId: string;
  phoneNumber: string;
  status: string;
  duration?: number;
  insights?: any[];
  transcript?: unknown;
}

/**
 * Applies a completed-call result (from the webhook, or from polling GET /calls/{callId})
 * to CallLog/OutboundCallTask/Enquiry. Shared so both delivery paths behave identically.
 */
export async function applyCallResult(task: OutboundCallTask, payload: CallResultPayload) {
  const { callId, phoneNumber, status, duration, insights, transcript } = payload;

  let conversation = await prisma.conversation.findUnique({
    where: { channel_externalContactId: { channel: "VOICE", externalContactId: phoneNumber } },
  });

  if (!conversation) {
    const enquiry = await prisma.enquiry.findUnique({ where: { id: task.enquiryId } });
    conversation = await prisma.conversation.create({
      data: { channel: "VOICE", externalContactId: phoneNumber, leadId: enquiry?.leadId },
    });
  }

  const summary = insights?.find((i: any) => i.actionType === "SUMMARIZE")?.output?.summary;
  const callLogStatus = status?.toLowerCase() === "completed" || status?.toLowerCase() === "answered" ? "COMPLETED" : "FAILED";

  const callLog = await prisma.callLog.upsert({
    where: { externalCallId: callId },
    create: {
      conversationId: conversation.id,
      externalCallId: callId,
      fromNumber: "CALLMATIC_BOT",
      toNumber: phoneNumber,
      status: callLogStatus,
      durationSeconds: duration ? Math.round(duration) : undefined,
      summary: summary || "No summary provided",
      transcript: transcript ? (typeof transcript === "string" ? transcript : JSON.stringify(transcript)) : undefined,
      insights: insights ?? undefined,
    },
    update: {
      status: callLogStatus,
      durationSeconds: duration ? Math.round(duration) : undefined,
      summary: summary || "No summary provided",
      transcript: transcript ? (typeof transcript === "string" ? transcript : JSON.stringify(transcript)) : undefined,
      insights: insights ?? undefined,
    },
  });

  await prisma.outboundCallTask.update({
    where: { id: task.id },
    data: { status: callLogStatus, callLogId: callLog.id },
  });

  const callOutcome = mapCallOutcome(status);
  const response = mapResponse(insights);
  const nextAction = deriveNextAction(callOutcome, response);

  await prisma.enquiry.update({
    where: { id: task.enquiryId },
    data: {
      score: 20,
      callTriggered: true,
      ...(callOutcome ? { callOutcome } : {}),
      ...(response ? { response } : {}),
      nextAction,
    },
  });

  logger.info("Applied Callmatic call result", { taskId: task.id, callId, status });
}
