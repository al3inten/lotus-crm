-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "autoCallEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "agent_configs" ADD COLUMN     "autoCallEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "call_logs" ADD COLUMN     "transcript" TEXT,
ADD COLUMN     "insights" JSONB;

-- AlterTable
ALTER TABLE "outbound_call_tasks" ADD COLUMN     "externalCallId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "outbound_call_tasks_externalCallId_key" ON "outbound_call_tasks"("externalCallId");
