-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- AlterTable: add locationId as nullable first so we can backfill it
ALTER TABLE "branches" ADD COLUMN "locationId" TEXT;

-- Backfill: one Location per distinct existing Branch.city, then point each
-- branch at the location matching its city.
INSERT INTO "locations" ("id", "name", "createdAt", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text || "city"), "city", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "city" FROM "branches") AS distinct_cities;

UPDATE "branches" b
SET "locationId" = l."id"
FROM "locations" l
WHERE l."name" = b."city";

-- Now that every branch has a location, enforce NOT NULL
ALTER TABLE "branches" ALTER COLUMN "locationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "branches_locationId_idx" ON "branches"("locationId");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
