// Container entrypoint: apply migrations, seed ONLY on first boot (empty DB), then start the
// server. Seeding once — not on every redeploy — keeps edits to the demo users (passwords, etc.)
// from being reset each deploy. Real data lives in the persistent db_data volume regardless.
//
// Uses `migrate deploy` (not `db push`): once real client data exists, schema changes must go
// through reviewed, versioned migration files (prisma/migrations/) rather than being inferred
// and applied automatically on every container boot.
//
// Self-heals against any database that already has these tables but no `_prisma_migrations`
// history — e.g. an existing deployment (Render, or any earlier `db push`-managed environment)
// hitting this image for the first time. `migrate deploy` fails with P3005 ("database schema is
// not empty") in that case; this baselines it by marking the single `baseline` migration as
// already-applied (without running its SQL, since the tables it would create already exist),
// then retries. On a genuinely fresh database this branch never triggers — migrate deploy just
// applies normally. See Prisma's docs on "baselining" an existing database.
const { execSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

function runMigrations() {
  try {
    execSync("npx prisma migrate deploy", { stdio: "pipe", encoding: "utf8" });
  } catch (err) {
    const output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    if (!output.includes("P3005")) {
      console.error(output);
      throw err;
    }
    console.log("[startup] Existing database with no migration history detected — baselining...");
    execSync('npx prisma migrate resolve --applied "20260801062013_baseline"', { stdio: "inherit" });
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
  }
}

async function main() {
  runMigrations();

  const prisma = new PrismaClient();
  let userCount = 0;
  try {
    userCount = await prisma.user.count();
  } catch {
    userCount = 0;
  }
  await prisma.$disconnect();

  if (userCount === 0) {
    console.log("[startup] Empty database — running seed…");
    try {
      execSync("npx prisma db seed", { stdio: "inherit" });
    } catch {
      console.log("[startup] seed failed (continuing to start server)");
    }
  } else {
    console.log(`[startup] Database already has ${userCount} users — skipping seed.`);
  }

  console.log("[startup] Starting server…");
  require("./dist/server.js");
}

main();
