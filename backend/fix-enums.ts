import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding new enum values to EnquiryStatus...");
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "EnquiryStatus" ADD VALUE 'UNDER_FOLLOW_UP';`);
  } catch (e) {
    console.log("Value UNDER_FOLLOW_UP might already exist:", e.message);
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "EnquiryStatus" ADD VALUE 'CLOSED';`);
  } catch (e) {
    console.log("Value CLOSED might already exist:", e.message);
  }

  console.log("Adding new enum values to LossReason...");
  try { await prisma.$executeRawUnsafe(`ALTER TYPE "LossReason" ADD VALUE 'LOST_TO_DEALER';`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TYPE "LossReason" ADD VALUE 'BOOKING_CANCEL';`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TYPE "LossReason" ADD VALUE 'RETAIL_CANCEL';`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TYPE "LossReason" ADD VALUE 'NOT_CONTACTABLE';`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TYPE "LossReason" ADD VALUE 'PRICE_ISSUE';`); } catch (e) {}
  try { await prisma.$executeRawUnsafe(`ALTER TYPE "LossReason" ADD VALUE 'PURCHASED_ANOTHER_BRAND';`); } catch (e) {}

  console.log("Updating Enquiry table...");
  await prisma.$executeRawUnsafe(`UPDATE "enquiries" SET status = 'UNDER_FOLLOW_UP' WHERE status::text = 'FOLLOW_UP';`);
  await prisma.$executeRawUnsafe(`UPDATE "enquiries" SET status = 'CLOSED' WHERE status::text = 'BOOKING_CANCEL';`);
  await prisma.$executeRawUnsafe(`UPDATE "enquiries" SET status = 'CLOSED' WHERE status::text = 'RETAIL_CANCEL';`);
  await prisma.$executeRawUnsafe(`UPDATE "enquiries" SET status = 'CLOSED' WHERE status::text = 'ENQUIRY_CLOSED';`);
  
  await prisma.$executeRawUnsafe(`UPDATE "enquiries" SET "lossReason" = 'LOST_TO_DEALER' WHERE "lossReason"::text = 'CO_DEALER';`);

  console.log("Updating enquiry_status_history table...");
  await prisma.$executeRawUnsafe(`UPDATE "enquiry_status_history" SET "fromStatus" = 'UNDER_FOLLOW_UP' WHERE "fromStatus"::text = 'FOLLOW_UP';`);
  await prisma.$executeRawUnsafe(`UPDATE "enquiry_status_history" SET "toStatus" = 'UNDER_FOLLOW_UP' WHERE "toStatus"::text = 'FOLLOW_UP';`);
  
  await prisma.$executeRawUnsafe(`UPDATE "enquiry_status_history" SET "fromStatus" = 'CLOSED' WHERE "fromStatus"::text IN ('BOOKING_CANCEL', 'RETAIL_CANCEL', 'ENQUIRY_CLOSED');`);
  await prisma.$executeRawUnsafe(`UPDATE "enquiry_status_history" SET "toStatus" = 'CLOSED' WHERE "toStatus"::text IN ('BOOKING_CANCEL', 'RETAIL_CANCEL', 'ENQUIRY_CLOSED');`);
  
  console.log("Done updating raw enums.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
