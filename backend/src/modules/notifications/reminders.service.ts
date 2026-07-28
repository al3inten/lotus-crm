import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface Reminder {
  id: string;
  type: "FOLLOW_UP" | "BIRTHDAY" | "ANNIVERSARY";
  title: string;
  body: string;
  linkUrl: string;
  /** FOLLOW_UP only — true when the due date has already passed (vs. due later today). */
  isOverdue?: boolean;
}

interface Ctx {
  userId: string;
  role: Role;
  branchFilter?: { branchId: string };
}

const leadLink = (leadId: string, enquiryId: string) => `/leads/${leadId}/enquiries/${enquiryId}`;
const sameMonthDay = (d: Date, today: Date) =>
  d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

/** Explicitly clear one reminder (id like "followup:<enquiryId>") from the bell — persists
 * until the user dismisses it, since the reminder itself is recomputed on every poll. */
export async function dismissReminder(userId: string, reminderId: string): Promise<void> {
  await prisma.reminderDismissal.upsert({
    where: { userId_reminderId: { userId, reminderId } },
    update: {},
    create: { userId, reminderId },
  });
}

/** Clear every reminder currently showing for this user in one shot ("Clear all"). */
export async function dismissAllReminders(ctx: Ctx): Promise<void> {
  const reminders = await getRemindersForUser(ctx, { includeDismissed: true });
  await prisma.reminderDismissal.createMany({
    data: reminders.map((r) => ({ userId: ctx.userId, reminderId: r.id })),
    skipDuplicates: true,
  });
}

/**
 * Live "reminders for today" for the bell menu: follow-ups due today plus customer birthdays
 * and delivery anniversaries. Computed on the fly (not stored), scoped to what the user owns:
 * CR/consultants see their own enquiries, branch managers their branch, admins everything.
 * A reminder only disappears when the user explicitly dismisses it (see dismissReminder) —
 * it does NOT clear itself just because time passes or the poll refetches.
 */
export async function getRemindersForUser(ctx: Ctx, opts: { includeDismissed?: boolean } = {}): Promise<Reminder[]> {
  // Base visibility scope, mirroring the follow-ups module.
  const scope: Prisma.EnquiryWhereInput = {};
  if (ctx.role === "CR_TEAM" || ctx.role === "CONSULTANT") {
    scope.assignedCrId = ctx.userId;
  } else if (ctx.branchFilter) {
    scope.branchId = ctx.branchFilter.branchId;
  }

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [dueToday, withDob, delivered] = await Promise.all([
    // Follow-ups due today OR already overdue — skip closed/delivered enquiries. Mirrors
    // leads.service.getReminders' scoping/window so the bell matches what the rest of the
    // app (Dashboard, ReminderModal) counts as "due".
    prisma.enquiry.findMany({
      where: {
        ...scope,
        status: { notIn: ["CLOSED", "DELIVERED"] },
        followUpDueAt: { lte: endOfToday },
      },
      select: { id: true, leadId: true, followUpDueAt: true, lead: { select: { name: true } } },
      orderBy: { followUpDueAt: "asc" },
      take: 50,
    }),
    // Candidates for a birthday today (month/day matched in JS below).
    prisma.enquiry.findMany({
      where: { ...scope, lead: { dob: { not: null } } },
      select: { id: true, leadId: true, lead: { select: { name: true, dob: true } } },
    }),
    // Candidates for a delivery anniversary today.
    prisma.enquiry.findMany({
      where: { ...scope, deliveredAt: { not: null } },
      select: { id: true, leadId: true, deliveredAt: true, carModel: true, lead: { select: { name: true } } },
    }),
  ]);

  const reminders: Reminder[] = [];

  for (const e of dueToday) {
    const isOverdue = !!e.followUpDueAt && e.followUpDueAt < now && e.followUpDueAt.toDateString() !== now.toDateString();
    reminders.push({
      id: `followup:${e.id}`,
      type: "FOLLOW_UP",
      title: isOverdue ? "Follow-up overdue" : "Follow-up due today",
      body: isOverdue ? `${e.lead.name} has an overdue follow-up.` : `${e.lead.name} has a follow-up due today.`,
      linkUrl: leadLink(e.leadId, e.id),
      isOverdue,
    });
  }

  // Birthdays — one per lead (a customer may have several enquiries).
  const seenBirthday = new Set<string>();
  for (const e of withDob) {
    const dob = e.lead.dob;
    if (!dob || seenBirthday.has(e.leadId) || !sameMonthDay(new Date(dob), now)) continue;
    seenBirthday.add(e.leadId);
    reminders.push({
      id: `birthday:${e.leadId}`,
      type: "BIRTHDAY",
      title: "🎂 Customer birthday today",
      body: `It's ${e.lead.name}'s birthday today — wish them well.`,
      linkUrl: leadLink(e.leadId, e.id),
    });
  }

  // Delivery anniversaries — only for years after the delivery year.
  for (const e of delivered) {
    const del = e.deliveredAt;
    if (!del) continue;
    const d = new Date(del);
    if (!sameMonthDay(d, now)) continue;
    const years = now.getFullYear() - d.getFullYear();
    if (years < 1) continue;
    reminders.push({
      id: `anniv:${e.id}`,
      type: "ANNIVERSARY",
      title: "🎉 Delivery anniversary",
      body: `${e.lead.name} — ${years} year${years > 1 ? "s" : ""} since taking delivery${
        e.carModel ? ` of the ${e.carModel}` : ""
      }.`,
      linkUrl: leadLink(e.leadId, e.id),
    });
  }

  if (opts.includeDismissed) return reminders;

  const dismissed = await prisma.reminderDismissal.findMany({
    where: { userId: ctx.userId, reminderId: { in: reminders.map((r) => r.id) } },
    select: { reminderId: true },
  });
  const dismissedIds = new Set(dismissed.map((d) => d.reminderId));
  return reminders.filter((r) => !dismissedIds.has(r.id));
}
