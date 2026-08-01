import { PrismaClient, EnquiryStatus, LeadSource, EnquiryType, LossReason, Department, LeadSubsource, SourceCategory, EnquiryCategory, CallOutcome, EnquiryResponse, NextAction, FollowUpType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Duplicated from src/config/constants.ts — this script runs via tsx directly against
// prisma/, which the production image doesn't ship src/ alongside (see container-start.js).
const MODULE_KEYS = [
  "dashboard",
  "leads",
  "customers",
  "follow-ups",
  "test-drives",
  "vehicles",
  "social-inbox",
  "call-campaigns",
  "bulk-messages",
  "templates",
  "media-library",
  "reports",
  "ai-agents",
  "branches",
  "integrations",
] as const;

// ---------- small deterministic-ish random helpers (no faker dependency) ----------
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function weightedPick<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

const FIRST_NAMES = [
  "Arun", "Priya", "Karthik", "Divya", "Suresh", "Lakshmi", "Ramesh", "Anitha", "Vijay", "Meena",
  "Senthil", "Kavya", "Prakash", "Deepa", "Manoj", "Swathi", "Ganesh", "Nithya", "Bala", "Revathi",
  "Sathish", "Preethi", "Mohan", "Vidya", "Raj", "Sangeetha", "Kumar", "Uma", "Sivaraj", "Geetha",
];
const LAST_NAMES = ["Kumar", "Raj", "Krishnan", "Murthy", "Iyer", "Pillai", "Nair", "Reddy", "Sharma", "Menon"];

function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
function randomPhone(): string {
  return `9${randInt(100000000, 999999999)}`;
}
// Deterministic on the loop index so rows within one run can never collide on the unique
// phoneNormalized column — salted with a random run id so re-running the script (e.g. to
// add another batch) doesn't collide with phone numbers a previous run already inserted.
const RUN_SALT = randInt(100, 899);
function uniquePhoneNormalized(index: number): string {
  return `+91${RUN_SALT}${String(index).padStart(6, "0")}`;
}

// Weighted so common channels (walk-in, meta ads) dominate, referral/others are rarer —
// mirrors a real dealership's actual lead mix.
const SOURCE_WEIGHTS: { value: LeadSource; weight: number }[] = [
  { value: "WALK_IN", weight: 28 },
  { value: "META_ADS", weight: 24 },
  { value: "WHATSAPP", weight: 14 },
  { value: "GOOGLE_SHEETS", weight: 10 },
  { value: "REFERRAL", weight: 10 },
  { value: "INSTAGRAM", weight: 8 },
  { value: "VOICE_AGENT", weight: 4 },
  { value: "MANUAL_OTHER", weight: 2 },
];

const ENQUIRY_TYPE_WEIGHTS: { value: EnquiryType; weight: number }[] = [
  { value: "NEW_CAR", weight: 78 },
  { value: "USED_CAR", weight: 12 },
  { value: "SERVICE_RELATED", weight: 6 },
  { value: "ACCESSORY", weight: 4 },
];

const DEPARTMENT_WEIGHTS: { value: Department; weight: number }[] = [
  { value: "SALES", weight: 80 },
  { value: "SERVICE", weight: 8 },
  { value: "USED_CAR", weight: 6 },
  { value: "ACCESSORIES", weight: 4 },
  { value: "OTHERS", weight: 2 },
];

const SUBSOURCE_WEIGHTS: { value: LeadSubsource; weight: number }[] = [
  { value: "WALK_IN", weight: 22 },
  { value: "HMIL_WEBSITE", weight: 16 },
  { value: "HMIL_SOCIAL_MEDIA", weight: 14 },
  { value: "SOCIAL_MEDIA", weight: 12 },
  { value: "CARPORTAL", weight: 10 },
  { value: "REFERRAL", weight: 8 },
  { value: "INCOMING_CALL", weight: 6 },
  { value: "HYPERLOCAL", weight: 5 },
  { value: "CTB", weight: 4 },
  { value: "DEALER_ACTIVITY", weight: 3 },
];

const SOURCE_CATEGORY_WEIGHTS: { value: SourceCategory; weight: number }[] = [
  { value: "WALK_IN", weight: 26 },
  { value: "DIGITAL", weight: 40 },
  { value: "DIGITAL_WALK_IN", weight: 12 },
  { value: "REFERRAL", weight: 10 },
  { value: "FIELD_ACTIVITY", weight: 7 },
  { value: "TELE_IN", weight: 5 },
];

const ENQUIRY_CATEGORY_WEIGHTS: { value: EnquiryCategory; weight: number }[] = [
  { value: "HOT", weight: 25 },
  { value: "WARM", weight: 45 },
  { value: "COLD", weight: 30 },
];

const LOSS_REASON_WEIGHTS: { value: LossReason; weight: number }[] = [
  { value: "PRICE_ISSUE", weight: 28 },
  { value: "PURCHASED_ANOTHER_BRAND", weight: 22 },
  { value: "NOT_CONTACTABLE", weight: 18 },
  { value: "LOST_TO_CO_DEALER", weight: 12 },
  { value: "OUT_OF_TERRITORY", weight: 8 },
  { value: "BOOKING_CANCEL", weight: 6 },
  { value: "RETAIL_CANCEL", weight: 4 },
  { value: "LOST_TO_COMPETITOR", weight: 2 },
];

const CALL_OUTCOME_WEIGHTS: { value: CallOutcome; weight: number }[] = [
  { value: "ANSWERED", weight: 55 },
  { value: "NO_ANSWER", weight: 32 },
  { value: "BUSY", weight: 13 },
];
const RESPONSE_WEIGHTS: { value: EnquiryResponse; weight: number }[] = [
  { value: "INTERESTED", weight: 40 },
  { value: "FOLLOW_UP", weight: 28 },
  { value: "CALLBACK", weight: 20 },
  { value: "NOT_INTERESTED", weight: 12 },
];
const NEXT_ACTION_WEIGHTS: { value: NextAction; weight: number }[] = [
  { value: "ASSIGN_TO_CR", weight: 35 },
  { value: "SCHEDULE_FOLLOW_UP", weight: 30 },
  { value: "SCHEDULE_CALLBACK", weight: 20 },
  { value: "RETRY_CALL", weight: 10 },
  { value: "MARK_LOST", weight: 5 },
];

// Funnel stages in pipeline order (mirrors analytics.service.ts FUNNEL_STAGES).
const FUNNEL_STAGES: EnquiryStatus[] = [
  "NEW",
  "APPOINTMENT_FIXED",
  "TEST_DRIVE",
  "BOOKED",
  "RETAIL_DONE",
  "RTO_DONE",
  "DELIVERED",
];

// How far a given enquiry gets before either converting or going cold — a realistic
// dealership funnel loses most volume in the first two stages.
const FUNNEL_DEPTH_WEIGHTS = [
  { value: 0, weight: 30 }, // stuck at New / Under Follow-up
  { value: 1, weight: 14 }, // Appointment Fixed, no further
  { value: 2, weight: 16 }, // Test Drive done, no booking yet
  { value: 3, weight: 12 }, // Booked
  { value: 4, weight: 9 }, // Retail Done
  { value: 5, weight: 6 }, // RTO Done
  { value: 6, weight: 13 }, // Delivered — full conversion
];

const ENQUIRY_COUNT = Number(process.env.SEED_HEAVY_COUNT ?? 400);
const SPREAD_DAYS = 365;

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const branches = await prisma.branch.findMany();
  if (branches.length === 0) {
    throw new Error("Run `npm run seed` first — no branches found to attach enquiries to.");
  }

  // Fallback "who did this" for EnquiryStatusHistory.changedById when an enquiry has no
  // assigned CR — ConsultantDirectory entries aren't Users and can't fill that FK.
  const seedUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!seedUser) throw new Error("Run `npm run seed` first — no SUPER_ADMIN user found.");

  // Default "CR" role definition (same one npm run seed creates) — reused here rather than
  // duplicated so heavy-seed CRs get the same permissions shape as the base seed's CRs.
  const crRole =
    (await prisma.roleDefinition.findFirst({ where: { branchId: null, name: "CR" } })) ??
    (await prisma.roleDefinition.create({
      data: {
        name: "CR",
        branchId: null,
        permissions: Object.fromEntries(
          MODULE_KEYS.map((key) => [key, (["dashboard", "leads", "follow-ups", "test-drives"] as string[]).includes(key) ? "write" : "none"])
        ),
        canViewAllBranches: false,
        restrictLeadsToOwn: true,
        isSystemDefault: true,
      },
    }));

  // Make sure every branch has at least one CR/consultant so the branch dimension isn't
  // lopsided (the base seed only staffs branch A). Consultants are directory entries, not
  // login accounts — see ConsultantDirectory in schema.prisma.
  for (const branch of branches) {
    const existingCr = await prisma.user.findFirst({ where: { branchId: branch.id, isCr: true } });
    if (!existingCr) {
      await prisma.user.create({
        data: {
          name: randomName(),
          email: `cr.${branch.code.toLowerCase()}@lotuscrm.com`,
          passwordHash,
          role: "STAFF",
          roleDefinitionId: crRole.id,
          isCr: true,
          branchId: branch.id,
        },
      });
    }
    const existingConsultant = await prisma.consultantDirectory.findFirst({ where: { branchId: branch.id } });
    if (!existingConsultant) {
      await prisma.consultantDirectory.create({
        data: {
          name: randomName(),
          mobile: randomPhone(),
          branchId: branch.id,
        },
      });
    }
  }

  const crsByBranch = new Map<string, { id: string }[]>();
  const consultantsByBranch = new Map<string, { id: string }[]>();
  for (const branch of branches) {
    crsByBranch.set(branch.id, await prisma.user.findMany({ where: { branchId: branch.id, isCr: true }, select: { id: true } }));
    consultantsByBranch.set(
      branch.id,
      await prisma.consultantDirectory.findMany({ where: { branchId: branch.id }, select: { id: true } })
    );
  }

  const vehicleModels = await prisma.vehicleModel.findMany({ include: { variants: true }, where: { isActive: true } });
  if (vehicleModels.length === 0) {
    throw new Error("Run `npm run seed` first — no vehicle models found.");
  }
  // A few popular models get disproportionately more enquiries than the rest — real
  // dealership demand isn't flat across the catalog.
  const modelWeights = vehicleModels.map((m) => ({
    model: m,
    weight: ["CRETA", "VENUE", "I20", "EXTER"].includes(m.name) ? 22 : ["VERNA", "ALCAZAR"].includes(m.name) ? 10 : 5,
  }));
  const pickModel = () => weightedPick(modelWeights.map((m) => ({ value: m.model, weight: m.weight })));

  console.log(`Generating ${ENQUIRY_COUNT} enquiries across ${branches.length} branch(es)...`);

  let created = 0;
  for (let i = 0; i < ENQUIRY_COUNT; i++) {
    const branch = pick(branches);
    const crs = crsByBranch.get(branch.id) ?? [];
    const consultants = consultantsByBranch.get(branch.id) ?? [];
    const assignedCr = crs.length ? pick(crs) : null;
    const consultant = consultants.length ? pick(consultants) : null;

    const vehicleModel = pickModel();
    const variant = vehicleModel.variants.length ? pick(vehicleModel.variants) : null;

    const createdAt = daysAgo(randInt(0, SPREAD_DAYS));
    const source = weightedPick(SOURCE_WEIGHTS);
    const enquiryType = weightedPick(ENQUIRY_TYPE_WEIGHTS);
    const department = weightedPick(DEPARTMENT_WEIGHTS);
    const subsource = weightedPick(SUBSOURCE_WEIGHTS);
    const sourceCategory = weightedPick(SOURCE_CATEGORY_WEIGHTS);
    const enquiryCategory = weightedPick(ENQUIRY_CATEGORY_WEIGHTS);
    const financeRequired = Math.random() < 0.55;

    let funnelDepth = weightedPick(FUNNEL_DEPTH_WEIGHTS);
    // Digital-lead auto-dial fields only make sense for non-walk-in sources.
    const hasAutoDial = source !== "WALK_IN" && Math.random() < 0.6;
    const callOutcome = hasAutoDial ? weightedPick(CALL_OUTCOME_WEIGHTS) : null;
    const response = hasAutoDial && callOutcome === "ANSWERED" ? weightedPick(RESPONSE_WEIGHTS) : null;
    const nextAction = hasAutoDial ? weightedPick(NEXT_ACTION_WEIGHTS) : null;

    // Lost deals can drop off from any point they reached — likelier early than late,
    // and never after Delivered (a delivered car is a completed sale, not "lost").
    const lostChance = funnelDepth === 6 ? 0 : 0.35 - funnelDepth * 0.04;
    const isLost = Math.random() < Math.max(0, lostChance);

    const name = randomName();
    const lead = await prisma.lead.create({
      data: {
        name,
        phoneRaw: randomPhone(),
        phoneNormalized: uniquePhoneNormalized(i),
        email: Math.random() < 0.6 ? `${name.toLowerCase().replace(/\s+/g, ".")}${i}@example.com` : null,
        area: pick(["Peelamedu", "RS Puram", "Saibaba Colony", "Gandhipuram", "Ramanathapuram", "Singanallur"]),
        pincode: `6410${randInt(10, 99)}`,
        createdAt,
      },
    });

    let cursor = createdAt;
    const finalStatus: EnquiryStatus = isLost ? "LOST" : FUNNEL_STAGES[funnelDepth];
    const isUnderFollowUp = !isLost && funnelDepth === 0 && Math.random() < 0.5;

    const enquiry = await prisma.enquiry.create({
      data: {
        leadId: lead.id,
        branchId: branch.id,
        carModel: vehicleModel.name,
        variant: variant?.name,
        source,
        enquiryType,
        department,
        subsource,
        sourceCategory,
        enquiryCategory,
        financeRequired,
        financeRemarks: financeRequired && Math.random() < 0.3 ? "Awaiting salary slips" : null,
        callOutcome,
        response,
        nextAction,
        score: hasAutoDial ? randInt(0, 100) : 0,
        callTriggered: hasAutoDial,
        assignedCrId: assignedCr?.id,
        consultantId: consultant?.id,
        status: isUnderFollowUp ? "UNDER_FOLLOW_UP" : finalStatus,
        appointmentScheduled: funnelDepth >= 1,
        appointmentAt: funnelDepth >= 1 ? addHours(cursor, 24) : null,
        testDriveInterested: funnelDepth >= 2,
        lossReason: isLost ? weightedPick(LOSS_REASON_WEIGHTS) : null,
        lossNote: isLost ? "Recorded during seed generation" : null,
        bookedAt: funnelDepth >= 3 && !isLost ? addHours(cursor, 24 * 5) : null,
        retailDoneAt: funnelDepth >= 4 && !isLost ? addHours(cursor, 24 * 10) : null,
        rtoDoneAt: funnelDepth >= 5 && !isLost ? addHours(cursor, 24 * 18) : null,
        deliveredAt: funnelDepth >= 6 && !isLost ? addHours(cursor, 24 * 25) : null,
        financeDocumentCollected: funnelDepth >= 3 && financeRequired ? Math.random() < 0.8 : null,
        financeLoanApproved: funnelDepth >= 3 && financeRequired ? Math.random() < 0.75 : null,
        financeDoReceived: funnelDepth >= 4 && financeRequired ? Math.random() < 0.7 : null,
        createdAt,
      },
    });

    // ---- status history: one row per stage actually reached, spaced out over time ----
    const reachedDepth = isLost ? randInt(0, funnelDepth) : funnelDepth;
    let prevStatus: EnquiryStatus | null = null;
    for (let s = 0; s <= reachedDepth; s++) {
      cursor = addHours(cursor, randInt(6, 96));
      const toStatus = FUNNEL_STAGES[s];
      if (s === 0 && !isUnderFollowUp) continue; // NEW is implicit at creation, no transition row
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          fromStatus: prevStatus,
          toStatus: s === 0 ? "UNDER_FOLLOW_UP" : toStatus,
          changedById: (assignedCr ?? seedUser).id,
          createdAt: cursor,
        },
      });
      prevStatus = s === 0 ? "UNDER_FOLLOW_UP" : toStatus;
    }
    if (isLost) {
      cursor = addHours(cursor, randInt(12, 72));
      await prisma.enquiryStatusHistory.create({
        data: {
          enquiryId: enquiry.id,
          fromStatus: prevStatus,
          toStatus: "LOST",
          changedById: (assignedCr ?? seedUser).id,
          note: "Recorded during seed generation",
          createdAt: cursor,
        },
      });
    }

    // ---- test drives: only for enquiries that reached Test Drive or later ----
    if (funnelDepth >= 2 && consultant) {
      const driveCount = Math.random() < 0.25 ? 2 : 1;
      for (let d = 0; d < driveCount; d++) {
        const scheduledAt = addHours(createdAt, 24 * (3 + d * 4));
        const completed = Math.random() < 0.85; // some scheduled drives never happen (no-show)
        await prisma.testDriveFeedback.create({
          data: {
            enquiryId: enquiry.id,
            conductedById: consultant.id,
            carModel: vehicleModel.name,
            variant: variant?.name,
            scheduledAt,
            completedAt: completed ? addHours(scheduledAt, 1) : null,
            rating: completed ? weightedPick([
              { value: 5, weight: 35 },
              { value: 4, weight: 35 },
              { value: 3, weight: 18 },
              { value: 2, weight: 8 },
              { value: 1, weight: 4 },
            ]) : null,
            comments: completed ? pick([
              "Liked the mileage and cabin space.",
              "Wants to compare with a rival model before deciding.",
              "Happy with the drive, discussing finance next.",
              "Felt the AMT was jerky in traffic.",
              "Loved the ADAS features on the top trim.",
            ]) : null,
            createdAt: scheduledAt,
          },
        });
      }
    }

    // ---- quotations: most Test-Drive-or-later enquiries get quoted, whether or not they book ----
    if (funnelDepth >= 2 && assignedCr && Math.random() < 0.75) {
      const onRoadPrice = randInt(650000, 2200000);
      const discountPct = weightedPick([
        { value: 0, weight: 30 },
        { value: 2, weight: 25 },
        { value: 4, weight: 20 },
        { value: 6, weight: 15 },
        { value: 9, weight: 10 },
      ]);
      const discount = Math.round((onRoadPrice * discountPct) / 100);
      await prisma.quotation.create({
        data: {
          enquiryId: enquiry.id,
          quotedById: assignedCr.id,
          variant: variant?.name,
          onRoadPrice,
          discount: discount || null,
          finalPrice: onRoadPrice - discount,
          validUntil: addHours(createdAt, 24 * 15),
          createdAt: addHours(createdAt, 24 * 4),
        },
      });
    }

    // ---- follow-ups: enquiries still being chased get a couple of logged touches ----
    if (funnelDepth <= 2 && assignedCr) {
      const followUpCount = randInt(1, 3);
      for (let f = 0; f < followUpCount; f++) {
        const followUpAt = addHours(createdAt, 24 * (f + 1) * 2);
        await prisma.followUp.create({
          data: {
            enquiryId: enquiry.id,
            followUpDate: followUpAt,
            type: weightedPick([
              { value: "CALL" as FollowUpType, weight: 45 },
              { value: "WHATSAPP" as FollowUpType, weight: 35 },
              { value: "VISIT" as FollowUpType, weight: 12 },
              { value: "EMAIL" as FollowUpType, weight: 8 },
            ]),
            remark: pick([
              "Customer asked for more time to decide.",
              "Discussed finance options, awaiting documents.",
              "Requested a callback next week.",
              "Comparing with another dealership's offer.",
              "Confirmed continued interest, following up again soon.",
            ]),
            nextFollowUpDate: Math.random() < 0.6 ? addHours(followUpAt, 24 * 4) : null,
            createdById: assignedCr.id,
            createdAt: followUpAt,
          },
        });
      }
    }

    created += 1;
    if (created % 50 === 0) console.log(`  ...${created}/${ENQUIRY_COUNT}`);
  }

  console.log(`Done. Created ${created} enquiries with proportional test drives, quotations, and follow-ups.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
