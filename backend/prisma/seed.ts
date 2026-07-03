import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@lotuscrm.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@lotuscrm.com",
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  const branchA = await prisma.branch.upsert({
    where: { code: "HYU-CHN-01" },
    update: {},
    create: { name: "Hyundai Chennai Central", code: "HYU-CHN-01", city: "Chennai" },
  });

  const branchB = await prisma.branch.upsert({
    where: { code: "HYU-CHN-02" },
    update: {},
    create: { name: "Hyundai Chennai OMR", code: "HYU-CHN-02", city: "Chennai" },
  });

  const branchManager = await prisma.user.upsert({
    where: { email: "manager.central@lotuscrm.com" },
    update: {},
    create: {
      name: "Ravi Kumar",
      email: "manager.central@lotuscrm.com",
      passwordHash,
      role: "BRANCH_MANAGER",
      branchId: branchA.id,
    },
  });

  const cr1 = await prisma.user.upsert({
    where: { email: "cr1.central@lotuscrm.com" },
    update: {},
    create: {
      name: "Priya S",
      email: "cr1.central@lotuscrm.com",
      passwordHash,
      role: "CR_TEAM",
      branchId: branchA.id,
    },
  });

  const cr2 = await prisma.user.upsert({
    where: { email: "cr2.central@lotuscrm.com" },
    update: {},
    create: {
      name: "Arun M",
      email: "cr2.central@lotuscrm.com",
      passwordHash,
      role: "CR_TEAM",
      branchId: branchA.id,
    },
  });

  const consultant1 = await prisma.user.upsert({
    where: { email: "consultant1.central@lotuscrm.com" },
    update: {},
    create: {
      name: "Karthik V",
      email: "consultant1.central@lotuscrm.com",
      passwordHash,
      role: "CONSULTANT",
      branchId: branchA.id,
    },
  });

  console.log({
    superAdmin: superAdmin.email,
    branchManager: branchManager.email,
    cr1: cr1.email,
    cr2: cr2.email,
    consultant1: consultant1.email,
    branches: [branchA.code, branchB.code],
  });
  console.log("Seed password for all demo users: Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
