  /**
 * Follow-ups seed — creates a spread of ACTIVE enquiries with scheduled next-follow-up
 * dates (Enquiry.followUpDueAt) plus a logged FollowUp on each, so the Follow-ups page
 * has data across every condition you'd want to test:
 *
 *   • Timeframe buckets: overdue, due today, this week, later
 *   • Multiple CRs (Priya S, Arun M) + a consultant  → test role scoping & "categorise by rep"
 *   • Both branches (Central + OMR)                   → test cross-branch admin filters
 *   • Varied statuses (NEW … BOOKED, all non-terminal) and HOT/WARM/COLD categories
 *   • Varied follow-up types (CALL/WHATSAPP/VISIT/EMAIL) with remarks
 *
 * Idempotent: all demo leads use phone prefix "79000" — it skips if they already exist,
 * and you can delete leads with phone 79000* to re-seed.
 *
 * Run with:  npx tsx prisma/seed-followups.ts   (from backend/, after `npm run seed`)
 */
import { PrismaClient, EnquiryStatus, EnquiryCategory, FollowUpType, LeadSource } from "@prisma/client";

const prisma = new PrismaClient();

const FIRST = ["Arjun", "Priya", "Karthik", "Divya", "Suresh", "Meena", "Rahul", "Anita", "Vijay", "Lakshmi", "Ravi", "Sneha", "Naveen", "Deepa", "Manoj", "Kavya"];
const LAST = ["Kumar", "Sharma", "Iyer", "Reddy", "Nair", "Patel", "Rao", "Menon"];
const CARS = ["CRETA", "VENUE", "I20", "VERNA", "EXTER", "ALCAZAR", "AURA", "TUCSON"];
const SOURCES: LeadSource[] = ["WALK_IN", "META_ADS", "WHATSAPP", "GOOGLE_SHEETS", "REFERRAL", "INSTAGRAM"];
const CATEGORIES: EnquiryCategory[] = ["HOT", "WARM", "COLD"];
// Non-terminal statuses only — a scheduled follow-up on a won/lost enquiry makes no sense.
const STATUSES: EnquiryStatus[] = ["NEW", "UNDER_FOLLOW_UP", "APPOINTMENT_FIXED", "TEST_DRIVE", "BOOKED"];
const TYPES: FollowUpType[] = ["CALL", "WHATSAPP", "VISIT", "EMAIL"];
const REMARKS = [
  "Customer asked to call back after salary credit.",
  "Interested in exchange — needs valuation for old car.",
  "Wants a weekend test drive, confirm slot.",
  "Comparing finance options, send EMI breakup.",
  "Spouse to decide on colour, follow up mid-week.",
  "Requested on-road price for top variant.",
  "Busy at work, prefers WhatsApp updates.",
  "Almost decided — nudge for booking amount.",
];

// Bucket definitions: how many days from today the follow-up falls (min..max, inclusive).
const BUCKETS: { label: string; count: number; minDay: number; maxDay: number }[] = [
  { label: "overdue", count: 8, minDay: -12, maxDay: -1 },
  { label: "today", count: 5, minDay: 0, maxDay: 0 },
  { label: "this week", count: 7, minDay: 1, maxDay: 6 },
  { label: "later", count: 6, minDay: 8, maxDay: 45 },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dayOffset(days: number): Date {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const existing = await prisma.lead.count({ where: { phoneNormalized: { startsWith: "79000" } } });
  if (existing > 0) {
    console.log(`Follow-up demo data already present (${existing} leads with phone 79000*) — skipping.`);
    console.log("To re-seed, delete those leads first, e.g. in psql:  DELETE FROM leads WHERE \"phoneNormalized\" LIKE '79000%';");
    return;
  }

  const seedUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!seedUser) throw new Error("Run the base seed first: npm run seed");

  const branches = await prisma.branch.findMany({ where: { isActive: true } });
  if (branches.length === 0) throw new Error("No branches found — run the base seed first: npm run seed");

  // Reps to round-robin across, per branch, so "categorise by rep" and role scoping have data.
  // isCr replaces the old CR_TEAM role tier (see routing.service.ts); consultants no longer
  // have login User accounts, so they can't be assignees here (see ConsultantDirectory).
  const crs = await prisma.user.findMany({ where: { isCr: true, isActive: true } });
  if (crs.length === 0) throw new Error("No CR users found — run the base seed first: npm run seed");

  let seq = 0;
  let created = 0;

  for (const bucket of BUCKETS) {
    for (let i = 0; i < bucket.count; i++) {
      const phone = `79000${String(10000 + seq).slice(-5)}`;
      const branch = pick(branches);
      // Prefer a CR in the same branch; fall back to any rep so every row has an owner.
      const branchCrs = crs.filter((c) => c.branchId === branch.id);
      const assignedCr = branchCrs.length ? pick(branchCrs) : pick(crs);
      const dueDate = dayOffset(randInt(bucket.minDay, bucket.maxDay));
      const status = pick(STATUSES);
      const createdAt = dayOffset(-randInt(3, 20)); // enquiry opened a few days/weeks ago

      const lead = await prisma.lead.create({
        data: { name: `${pick(FIRST)} ${pick(LAST)}`, phoneRaw: `+91 ${phone}`, phoneNormalized: phone, createdAt },
      });

      const enquiry = await prisma.enquiry.create({
        data: {
          leadId: lead.id,
          branchId: branch.id,
          carModel: pick(CARS),
          source: pick(SOURCES),
          enquiryType: "NEW_CAR",
          enquiryCategory: pick(CATEGORIES),
          status,
          assignedCrId: assignedCr.id,
          followUpDueAt: dueDate,
          createdAt,
        },
      });

      // A logged follow-up so the row shows a "last follow-up" remark + type.
      await prisma.followUp.create({
        data: {
          enquiryId: enquiry.id,
          createdById: assignedCr.id,
          followUpDate: createdAt,
          type: pick(TYPES),
          remark: pick(REMARKS),
          nextFollowUpDate: dueDate,
          createdAt,
        },
      });

      seq++;
      created++;
    }
  }

  const total = BUCKETS.reduce((n, b) => n + b.count, 0);
  console.log(`Created ${created}/${total} follow-up demo enquiries across ${branches.length} branch(es) and ${crs.length} rep(s).`);
  console.log("Buckets:", BUCKETS.map((b) => `${b.label}=${b.count}`).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
