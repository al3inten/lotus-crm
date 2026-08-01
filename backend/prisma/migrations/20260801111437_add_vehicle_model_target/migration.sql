-- CreateTable
CREATE TABLE "vehicle_model_targets" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "bookingTarget" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "vehicle_model_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_model_targets_modelId_branchId_month_key" ON "vehicle_model_targets"("modelId", "branchId", "month");

-- AddForeignKey
ALTER TABLE "vehicle_model_targets" ADD CONSTRAINT "vehicle_model_targets_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_model_targets" ADD CONSTRAINT "vehicle_model_targets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_model_targets" ADD CONSTRAINT "vehicle_model_targets_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
