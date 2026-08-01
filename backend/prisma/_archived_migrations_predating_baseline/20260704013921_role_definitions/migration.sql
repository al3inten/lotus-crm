-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roleDefinitionId" TEXT;

-- CreateTable
CREATE TABLE "role_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branchId" TEXT,
    "baseRole" "Role" NOT NULL,
    "permissions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_definitions_branchId_name_key" ON "role_definitions"("branchId", "name");

-- AddForeignKey
ALTER TABLE "role_definitions" ADD CONSTRAINT "role_definitions_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleDefinitionId_fkey" FOREIGN KEY ("roleDefinitionId") REFERENCES "role_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
