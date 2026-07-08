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
    consultant1: consultant1.email,
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
