/**
 * One-off backfill: converts legacy Role/RoleDefinition/Consultant data into the new
 * section-based permission model and the ConsultantDirectory.
 *
 * ============================================================================
 * IMPORTANT — ORDERING REQUIREMENT (read before running this anywhere for real)
 * ============================================================================
 * This script MUST run against a database that is still on the OLD schema shape:
 *   - Role enum still has SUPER_ADMIN | ADMIN | BRANCH_MANAGER | CR_TEAM | CONSULTANT
 *   - role_definitions still has a `base_role` column and `permissions` is a plain
 *     JSON array of enabled module-key strings (not yet the { [key]: level } map)
 *   - enquiries.consultant_id still points at users.id (the ConsultantDirectory FK
 *     swap has NOT happened yet)
 *
 * i.e. run this AFTER the additive migration (backend/prisma/migrations/manual/
 * 002_part_b_c_additive.sql — adds canViewAllBranches/restrictLeadsToOwn/isCr/
 * consultant_directory alongside the old columns) but BEFORE the narrowing
 * migration (003_part_b_c_narrow.sql — drops base_role, narrows the Role enum,
 * repoints the FK). The Prisma Client generated INTO THIS REPO already reflects
 * the END STATE schema (Part B/C already landed here), so its generated types do
 * NOT have `baseRole` or the old `permissions: string[]` shape — that's why every
 * read/write against those legacy columns below goes through `prisma.$queryRawUnsafe`
 * / `prisma.$executeRawUnsafe` instead of the typed Prisma Client API. Anything that
 * targets fields already present in both schemas (ConsultantDirectory rows, the new
 * boolean columns, Enquiry.consultantId once repointed) uses the normal typed client.
 *
 * This script has NOT been executed against a real database in this environment
 * (no reachable dev DB — only .env.example exists). It is written to type-check /
 * parse cleanly; a human must dry-run it against a copy of production data before
 * ever pointing it at the real thing.
 * ============================================================================
 */

import { PrismaClient } from "@prisma/client";
import { MODULE_KEYS, ModuleKey, PermissionLevel } from "../src/config/constants";

const prisma = new PrismaClient();

type LegacyRoleDefRow = {
  id: string;
  name: string;
  branchId: string | null;
  permissions: unknown; // old shape: string[]
  base_role: string | null; // "ADMIN" | "BRANCH_MANAGER" | "CR_TEAM" | "CONSULTANT" | null
};

type LegacyUserRow = {
  id: string;
  role: string; // old enum value, pre-narrowing
  branchId: string | null;
  roleDefinitionId: string | null;
  phone: string | null;
  name: string;
};

function convertPermissions(oldKeys: string[]): Record<ModuleKey, PermissionLevel> {
  const map = {} as Record<ModuleKey, PermissionLevel>;
  const normalized = new Set(
    oldKeys.map((k) => (k === "departments" ? "branches" : k))
  );
  for (const key of MODULE_KEYS) {
    map[key] = normalized.has(key) ? "write" : "none";
  }
  return map;
}

/** Best-effort permission guess for a synthetic role backfilled from a bare enum tier. */
function permissionsForTier(tier: "ADMIN" | "BRANCH_MANAGER" | "CR_TEAM" | "CONSULTANT"): Record<ModuleKey, PermissionLevel> {
  const map = {} as Record<ModuleKey, PermissionLevel>;
  for (const key of MODULE_KEYS) {
    switch (tier) {
      case "ADMIN":
      case "BRANCH_MANAGER":
        // These tiers could reach almost everything under the old requireRole gates —
        // give them write everywhere except the two SUPER_ADMIN-only surfaces.
        map[key] = "write";
        break;
      case "CR_TEAM":
        map[key] = ["dashboard", "leads", "follow-ups", "test-drives"].includes(key) ? "write" : "none";
        break;
      case "CONSULTANT":
        // Consultants never had a real permissions surface of their own historically
        // (they only ever touched the enquiry pipeline they were assigned into) —
        // this branch should rarely fire since consultant Users are converted to
        // ConsultantDirectory rows in step 4 and deactivated, not repointed to STAFF.
        map[key] = "none";
        break;
    }
  }
  return map;
}

async function step1_convertRoleDefinitions() {
  console.log("\n[1/5] Converting existing RoleDefinition.permissions to the new shape...");

  const legacyRoles = await prisma.$queryRawUnsafe<LegacyRoleDefRow[]>(
    `SELECT id, name, "branchId", permissions, "baseRole" as base_role FROM role_definitions`
  );

  let converted = 0;
  for (const row of legacyRoles) {
    const oldPermissions: string[] = Array.isArray(row.permissions) ? (row.permissions as string[]) : [];
    const newPermissions = convertPermissions(oldPermissions);
    const canViewAllBranches = row.base_role === "ADMIN";
    const restrictLeadsToOwn = row.base_role === "CR_TEAM";

    await prisma.$executeRawUnsafe(
      `UPDATE role_definitions SET permissions = $1::jsonb, "canViewAllBranches" = $2, "restrictLeadsToOwn" = $3 WHERE id = $4`,
      JSON.stringify(newPermissions),
      canViewAllBranches,
      restrictLeadsToOwn,
      row.id
    );
    converted += 1;
  }

  console.log(`  converted ${converted} role definition(s)`);
  return converted;
}

async function step2_seedCrRole(): Promise<{ id: string; created: boolean }> {
  console.log("\n[2/5] Seeding the default global 'CR' role (if not already present)...");

  const existing = await prisma.roleDefinition.findFirst({
    where: { name: "CR", branchId: null },
    select: { id: true },
  });
  if (existing) {
    console.log(`  'CR' role already exists (id=${existing.id}) — skipping seed`);
    return { id: existing.id, created: false };
  }

  const permissions: Record<ModuleKey, PermissionLevel> = {} as Record<ModuleKey, PermissionLevel>;
  for (const key of MODULE_KEYS) {
    permissions[key] = ["dashboard", "leads", "follow-ups", "test-drives"].includes(key) ? "write" : "none";
  }

  const created = await prisma.roleDefinition.create({
    data: {
      name: "CR",
      branchId: null,
      permissions,
      canViewAllBranches: false,
      restrictLeadsToOwn: true,
      isActive: true,
    },
  });
  console.log(`  seeded 'CR' role (id=${created.id})`);
  return { id: created.id, created: true };
}

async function step3_convertBareTierUsers(crRoleId: string) {
  console.log("\n[3/5] Converting users on a bare enum tier (no custom roleDefinitionId)...");

  const bareUsers = await prisma.$queryRawUnsafe<LegacyUserRow[]>(
    `SELECT id, role, "branchId", "roleDefinitionId", phone, name FROM users
     WHERE "roleDefinitionId" IS NULL AND role IN ('ADMIN','BRANCH_MANAGER','CR_TEAM','CONSULTANT')`
  );

  // One synthetic role per (tier, branchId) combo actually in use — except CR_TEAM,
  // which always points at the seeded "CR" role instead of a bespoke synthetic one.
  const syntheticRoleCache = new Map<string, string>(); // key: `${tier}:${branchId ?? "null"}` -> roleDefinitionId
  let syntheticCreated = 0;
  let usersRepointed = 0;

  for (const user of bareUsers) {
    const tier = user.role as "ADMIN" | "BRANCH_MANAGER" | "CR_TEAM" | "CONSULTANT";

    let targetRoleId: string;
    if (tier === "CR_TEAM") {
      targetRoleId = crRoleId;
    } else {
      const cacheKey = `${tier}:${user.branchId ?? "null"}`;
      let roleId = syntheticRoleCache.get(cacheKey);
      if (!roleId) {
        const name = `Legacy ${tier} (auto)`;
        const created = await prisma.roleDefinition.create({
          data: {
            name,
            branchId: user.branchId,
            permissions: permissionsForTier(tier),
            canViewAllBranches: tier === "ADMIN",
            restrictLeadsToOwn: false,
            isActive: true,
          },
        });
        roleId = created.id;
        syntheticRoleCache.set(cacheKey, roleId);
        syntheticCreated += 1;
        console.log(
          `  REVIEW: created synthetic role "${name}" (id=${roleId}, branchId=${user.branchId ?? "global"}) for legacy tier ${tier} — verify its guessed permissions before trusting it in production.`
        );
      }
      targetRoleId = roleId;
    }

    // Consultant users are handled entirely in step 4 (converted to directory rows and
    // deactivated) — do not repoint them at a STAFF role definition or flip their role.
    if (tier === "CONSULTANT") continue;

    await prisma.$executeRawUnsafe(
      `UPDATE users SET role = 'STAFF', "roleDefinitionId" = $1 WHERE id = $2`,
      targetRoleId,
      user.id
    );
    usersRepointed += 1;
  }

  console.log(`  created ${syntheticCreated} synthetic role(s); repointed ${usersRepointed} user(s) to STAFF`);
  return { syntheticCreated, usersRepointed };
}

async function step4_convertConsultants() {
  console.log("\n[4/5] Converting CONSULTANT users into ConsultantDirectory rows...");

  const consultantUsers = await prisma.$queryRawUnsafe<LegacyUserRow[]>(
    `SELECT id, role, "branchId", phone, name FROM users WHERE role = 'CONSULTANT'`
  );

  let consultantsConverted = 0;
  let enquiriesRepointed = 0;
  let testDriveFeedbacksRepointed = 0;

  for (const user of consultantUsers) {
    if (!user.branchId) {
      console.log(`  REVIEW: consultant user ${user.id} (${user.name}) has no branchId — skipping directory conversion, leaving their login as-is for manual review.`);
      continue;
    }

    const directoryEntry = await prisma.consultantDirectory.create({
      data: {
        name: user.name,
        mobile: user.phone ?? "",
        branchId: user.branchId,
        isActive: true,
      },
    });
    consultantsConverted += 1;

    const { count } = await prisma.enquiry.updateMany({
      where: { consultantId: user.id },
      data: { consultantId: directoryEntry.id },
    });
    enquiriesRepointed += count;

    // TestDriveFeedback.conductedById was ALSO repointed from User -> ConsultantDirectory
    // (see backend/prisma/schema.prisma — consultants no longer log in, so "who conducted
    // this drive" can only be a directory entry going forward). This is a necessary
    // extension beyond the plan's literal file list; repoint any rows this consultant
    // user conducted, using raw SQL since conductedById's FK still points at users at
    // this point in the migration sequence (003 adds the real FK after this runs).
    const feedbackResult = await prisma.$executeRawUnsafe(
      `UPDATE test_drive_feedback SET "conductedById" = $1 WHERE "conductedById" = $2`,
      directoryEntry.id,
      user.id
    );
    testDriveFeedbacksRepointed += Number(feedbackResult ?? 0);

    // Deactivate rather than delete — preserves audit history / FK integrity for
    // anything else still referencing this user row (comments, notes, etc.).
    await prisma.$executeRawUnsafe(`UPDATE users SET "isActive" = false WHERE id = $1`, user.id);
  }

  console.log(
    `  converted ${consultantsConverted} consultant(s); repointed ${enquiriesRepointed} enquiry row(s); repointed ${testDriveFeedbacksRepointed} test drive feedback row(s)`
  );
  return { consultantsConverted, enquiriesRepointed, testDriveFeedbacksRepointed };
}

async function main() {
  const rolesConverted = await step1_convertRoleDefinitions();
  const { id: crRoleId, created: crRoleCreated } = await step2_seedCrRole();
  const { syntheticCreated, usersRepointed } = await step3_convertBareTierUsers(crRoleId);
  const { consultantsConverted, enquiriesRepointed, testDriveFeedbacksRepointed } = await step4_convertConsultants();

  console.log("\n[5/5] Summary");
  console.log("=============");
  console.log(`  Role definitions converted to new permissions shape: ${rolesConverted}`);
  console.log(`  Synthetic roles created for review: ${syntheticCreated}`);
  console.log(`  'CR' role: ${crRoleCreated ? "seeded" : "already existed, skipped"}`);
  console.log(`  Bare-tier users repointed to STAFF + a role: ${usersRepointed}`);
  console.log(`  Consultants converted to ConsultantDirectory: ${consultantsConverted}`);
  console.log(`  Enquiries repointed to the new consultant directory id: ${enquiriesRepointed}`);
  console.log(`  TestDriveFeedback rows repointed to the new consultant directory id: ${testDriveFeedbacksRepointed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
