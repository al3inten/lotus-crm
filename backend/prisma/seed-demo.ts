/**
 * Demo/analytics seed — adds a realistic spread of enquiries across the past 18 months
 * (so year-over-year comparison has a base period), walks a portion of them through the
 * pipeline with believable time gaps (so time-in-stage and funnel have real data), and
 * marks some LOST with reasons. Idempotent-ish: skips if demo leads already exist.
 *
 * Run with: npx tsx prisma/seed-demo.ts
 */
import { PrismaClient, EnquiryStatus, LeadSource, LossReason } from "@prisma/client";

const prisma = new PrismaClient();

const CAR_MODELS = ["Creta", "Venue", "i20", "Verna", "Exter", "Alcazar", "Tucson"];
const SOURCES: LeadSource[] = ["WALK_IN", "META_ADS", "WHATSAPP", "GOOGLE_SHEETS", "REFERRAL", "INSTAGRAM"];
const LOCATIONS = ["Anna Nagar", "Adyar", "Velachery", "T Nagar", "OMR", "Porur"];
const FIRST_NAMES = ["Arjun", "Priya", "Karthik", "Divya", "Suresh", "Meena", "Rahul", "Anita", "Vijay", "Lakshmi", "Ravi", "Sneha"];
const LAST_NAMES = ["Kumar", "Sharma", "Iyer", "Reddy", "Nair", "Patel", "Rao", "Menon"];
const LOSS_REASONS: LossReason[] = ["OTHER_REASON", "LOST_TO_DEALER", "OUT_OF_TERRITORY"];

// The happy path an enquiry walks through, with typical hours spent in each stage.
// NEW goes straight to APPOINTMENT_FIXED — UNDER_FOLLOW_UP is kept in the schema only so
// enquiries already there can still progress, not as a normal first stop (see constants.ts).
const PIPELINE: { status: EnquiryStatus; typicalHours: number }[] = [
  { status: "APPOINTMENT_FIXED", typicalHours: 48 },
  { status: "TEST_DRIVE", typicalHours: 72 },
  { status: "BOOKED", typicalHours: 96 },
  { status: "RETAIL_DONE", typicalHours: 120 },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(hours: number): number {
  return hours * (0.5 + Math.random());
}

async function main() {
  const existing = await prisma.lead.count({ where: { phoneNormalized: { startsWith: "77000" } } });
  if (existing > 0) {
    console.log(`Demo data already present (${existing} demo leads) — skipping. Delete leads with phone 77000* to re-seed.`);
    return;
  }

  const seedUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!seedUser) throw new Error("Run the base seed first (npm run seed)");

  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  if (branches.length === 0) throw new Error("Run the base seed first (npm run seed)");

  // isCr replaces the old CR_TEAM role tier (see routing.service.ts). Consultants no longer
  // have login User accounts — see ConsultantDirectory in schema.prisma.
  const crTeam = await prisma.user.findMany({ where: { isCr: true, isActive: true } });
  const consultants = await prisma.consultantDirectory.findMany({ where: { isActive: true } });

  const now = Date.now();
  const DEMO_COUNT = 140;
  let created = 0;

  for (let i = 0; i < DEMO_COUNT; i++) {
    // Spread creation over the past ~18 months so this-year vs last-year both have data.
    const ageDays = Math.floor(Math.random() * 540);
    const createdAt = new Date(now - ageDays * 24 * 3600 * 1000);

    const phone = `77000${String(10000 + i).slice(-5)}`;
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const branch = pick(branches);
    const source = pick(SOURCES);
    const assignedCr = crTeam.length > 0 ? pick(crTeam) : null;

    const lead = await prisma.lead.create({
      data: { name, phoneRaw: phone, phoneNormalized: phone, createdAt },
    });

    // Decide the enquiry's fate: ~30% convert fully, ~25% lost somewhere, rest in-flight.
    const fate = Math.random();
    const stagesToWalk =
      fate < 0.3
        ? PIPELINE.length // full conversion to RETAIL_DONE
        : Math.floor(Math.random() * (PIPELINE.length - 1)); // partial progress
    const isLost = fate >= 0.3 && fate < 0.55 && stagesToWalk > 0;

    const enquiry = await prisma.enquiry.create({
      data: {
        leadId: lead.id,
        branchId: branch.id,
        carModel: pick(CAR_MODELS),
        source,
        enquiryType: "NEW_CAR",
        location: pick(LOCATIONS),
        status: "NEW",
        assignedCrId: assignedCr?.id,
        createdAt,
      },
    });

    let cursor = createdAt.getTime();
    const history: { toStatus: EnquiryStatus; fromStatus: EnquiryStatus | null; at: Date }[] = [
      { toStatus: "NEW", fromStatus: null, at: createdAt },
    ];

    let currentStatus: EnquiryStatus = "NEW";
    for (let s = 0; s < stagesToWalk; s++) {
      const stage = PIPELINE[s];
      cursor += jitter(stage.typicalHours) * 3600 * 1000;
      if (cursor > now) break; // don't write history into the future
      history.push({ toStatus: stage.status, fromStatus: currentStatus, at: new Date(cursor) });
      currentStatus = stage.status;
    }

    if (isLost && cursor + 24 * 3600 * 1000 < now) {
      cursor += jitter(48) * 3600 * 1000;
      history.push({ toStatus: "LOST", fromStatus: currentStatus, at: new Date(cursor) });
      currentStatus = "LOST";
    }

    await prisma.enquiryStatusHistory.createMany({
      data: history.map((h) => ({
        enquiryId: enquiry.id,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        changedById: seedUser.id,
        createdAt: h.at,
      })),
    });

    await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        status: currentStatus,
        lossReason: currentStatus === "LOST" ? pick(LOSS_REASONS) : undefined,
        consultantId:
          consultants.length > 0 && history.some((h) => h.toStatus === "APPOINTMENT_FIXED")
            ? pick(consultants).id
            : undefined,
      },
    });

    created++;
  }

  console.log(`Created ${created} demo enquiries with pipeline history across ~18 months.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
