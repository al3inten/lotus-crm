import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Duplicated from src/config/constants.ts (not vice-versa: the production image copies only
// dist/, not src/, so this file can't import from src/ at runtime — see container-start.js).
// Keep in sync with MODULE_KEYS there.
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
type ModuleKey = (typeof MODULE_KEYS)[number];
type PermissionLevel = "none" | "read" | "write";

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

  // Branch Manager tier — same shape the backfill script gives legacy ADMIN/BRANCH_MANAGER
  // users: STAFF role + a role definition with write everywhere and cross-branch visibility.
  // (findFirst + create instead of upsert: Prisma's compound-unique `where` doesn't accept
  // null for the nullable branchId half of @@unique([branchId, name]).)
  const branchManagerRole =
    (await prisma.roleDefinition.findFirst({ where: { branchId: null, name: "Branch Manager" } })) ??
    (await prisma.roleDefinition.create({
      data: {
        name: "Branch Manager",
        branchId: null,
        permissions: Object.fromEntries(MODULE_KEYS.map((key) => [key, "write"])) as Record<ModuleKey, PermissionLevel>,
        canViewAllBranches: true,
        restrictLeadsToOwn: false,
        canReassignCustomerCr: true,
      },
    }));

  // Default "CR" role — mirrors step2_seedCrRole in backend/scripts/backfill-roles-and-consultants.ts:
  // write on the CR's day-to-day sections, restricted to their own assigned leads.
  const crRole =
    (await prisma.roleDefinition.findFirst({ where: { branchId: null, name: "CR" } })) ??
    (await prisma.roleDefinition.create({
      data: {
        name: "CR",
        branchId: null,
        permissions: Object.fromEntries(
          MODULE_KEYS.map((key) => [key, ["dashboard", "leads", "follow-ups", "test-drives"].includes(key) ? "write" : "none"])
        ) as Record<ModuleKey, PermissionLevel>,
        canViewAllBranches: false,
        restrictLeadsToOwn: true,
        isSystemDefault: true,
      },
    }));

  const branchManager = await prisma.user.upsert({
    where: { email: "manager.central@lotuscrm.com" },
    update: {},
    create: {
      name: "Ravi Kumar",
      email: "manager.central@lotuscrm.com",
      passwordHash,
      role: "STAFF",
      roleDefinitionId: branchManagerRole.id,
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
      role: "STAFF",
      roleDefinitionId: crRole.id,
      isCr: true,
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
      role: "STAFF",
      roleDefinitionId: crRole.id,
      isCr: true,
      branchId: branchA.id,
    },
  });

  // Consultants no longer have login accounts — see ConsultantDirectory in schema.prisma.
  const consultant1 = await prisma.consultantDirectory.upsert({
    where: { id: "seed-consultant-karthik-v" },
    update: {},
    create: {
      id: "seed-consultant-karthik-v",
      name: "Karthik V",
      mobile: "9840000000",
      branchId: branchA.id,
    },
  });

  const VEHICLE_CATALOG: {
    model: string;
    variants: { name: string; transmissionType: "MANUAL" | "AUTOMATIC"; fuelType: "PETROL" | "DIESEL" | "CNG_PETROL" | "ELECTRIC" }[];
  }[] = [
    {
      model: "GRAND I10 NIOS",
      variants: [
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.2 AMT", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "CNG_PETROL" },
      ],
    },
    {
      model: "AURA",
      variants: [
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.2 AMT", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "CNG_PETROL" },
      ],
    },
    {
      model: "AURA - PRIME TAXI",
      variants: [{ name: "1.2 MT", transmissionType: "MANUAL", fuelType: "CNG_PETROL" }],
    },
    {
      model: "I10 - PRIME TAXI",
      variants: [{ name: "1.2 MT", transmissionType: "MANUAL", fuelType: "CNG_PETROL" }],
    },
    {
      model: "EXTER",
      variants: [
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.2 AMT", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "CNG_PETROL" },
      ],
    },
    {
      model: "I20",
      variants: [
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.2 IVT", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
      ],
    },
    {
      model: "VENUE",
      variants: [
        { name: "1.2 MT", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.0 MT Turbo", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.0 DCT", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.5 MT", transmissionType: "MANUAL", fuelType: "DIESEL" },
      ],
    },
    {
      model: "CRETA",
      variants: [
        { name: "1.5 MT", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.5 IVT", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.5 DCT Turbo", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.5 MT", transmissionType: "MANUAL", fuelType: "DIESEL" },
        { name: "1.5 AT", transmissionType: "AUTOMATIC", fuelType: "DIESEL" },
      ],
    },
    {
      model: "ALCAZAR",
      variants: [
        { name: "1.5 MT Turbo", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.5 DCT Turbo", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.5 MT", transmissionType: "MANUAL", fuelType: "DIESEL" },
        { name: "1.5 AT", transmissionType: "AUTOMATIC", fuelType: "DIESEL" },
      ],
    },
    {
      model: "VERNA",
      variants: [
        { name: "1.5 MT", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.5 IVT", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
        { name: "1.5 MT Turbo", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.5 DCT Turbo", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
      ],
    },
    {
      model: "I20 NLINE",
      variants: [
        { name: "1.0 MT Turbo", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.0 DCT Turbo", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
      ],
    },
    {
      model: "VENUE NLINE",
      variants: [
        { name: "1.0 MT Turbo", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.0 DCT Turbo", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
      ],
    },
    {
      model: "CRETA NLINE",
      variants: [
        { name: "1.5 MT Turbo", transmissionType: "MANUAL", fuelType: "PETROL" },
        { name: "1.5 DCT Turbo", transmissionType: "AUTOMATIC", fuelType: "PETROL" },
      ],
    },
    {
      model: "IONIQ 5",
      variants: [{ name: "AT Electric", transmissionType: "AUTOMATIC", fuelType: "ELECTRIC" }],
    },
    {
      model: "CRETA EV",
      variants: [{ name: "AT Electric", transmissionType: "AUTOMATIC", fuelType: "ELECTRIC" }],
    },
  ];

  for (const { model, variants } of VEHICLE_CATALOG) {
    const vehicleModel = await prisma.vehicleModel.upsert({
      where: { name: model },
      update: {},
      create: { name: model },
    });
    for (const variant of variants) {
      await prisma.vehicleVariant.upsert({
        where: {
          modelId_name_fuelType: { modelId: vehicleModel.id, name: variant.name, fuelType: variant.fuelType },
        },
        update: {},
        create: { ...variant, modelId: vehicleModel.id },
      });
    }
  }

  console.log({
    superAdmin: superAdmin.email,
    branchManager: branchManager.email,
    cr1: cr1.email,
    cr2: cr2.email,
    consultant1: consultant1.name,
    branches: [branchA.code, branchB.code],
    vehicleModels: VEHICLE_CATALOG.length,
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
