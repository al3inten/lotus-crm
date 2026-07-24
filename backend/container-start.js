// Container entrypoint: sync schema, seed ONLY on first boot (empty DB), then start the server.
// Seeding once — not on every redeploy — keeps edits to the demo users (passwords, etc.) from
// being reset each deploy. Real data lives in the persistent db_data volume regardless.
const { execSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

async function main() {
  // Non-destructive schema sync (additive changes apply; destructive ones abort — no data loss).
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });

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
