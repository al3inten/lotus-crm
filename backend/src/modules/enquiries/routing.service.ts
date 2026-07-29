import { Prisma, PrismaClient } from "@prisma/client";
import { istDayBounds } from "../../lib/istDate";

type Tx = Prisma.TransactionClient | PrismaClient;

function startOfToday(): Date {
  return istDayBounds().startOfToday;
}

/**
 * Stateless, count-based round robin: picks the active, routing-available
 * user flagged `isCr` in the branch with the fewest enquiries assigned today
 * (isCr is the per-user "acts as a CR" toggle — replaces the old CR_TEAM role tier).
 * Self-balancing — no drift when staff are added/removed, no separate cursor table.
 * Returns null if no eligible CR exists (lead stays unassigned).
 */
export async function getNextCrForBranch(tx: Tx, branchId: string): Promise<string | null> {
  const candidates = await tx.user.findMany({
    where: { branchId, isCr: true, isActive: true, isAvailableForRouting: true },
    select: { id: true },
  });

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].id;

  const candidateIds = candidates.map((c) => c.id);

  const counts = await tx.enquiry.groupBy({
    by: ["assignedCrId"],
    where: {
      branchId,
      assignedCrId: { in: candidateIds },
      createdAt: { gte: startOfToday() },
    },
    _count: true,
  });

  const countMap = new Map<string, number>(candidateIds.map((id) => [id, 0]));
  for (const row of counts) {
    if (row.assignedCrId) countMap.set(row.assignedCrId, row._count);
  }

  let chosen = candidateIds[0];
  let lowest = countMap.get(chosen) ?? 0;
  for (const id of candidateIds) {
    const count = countMap.get(id) ?? 0;
    if (count < lowest) {
      chosen = id;
      lowest = count;
    }
  }

  return chosen;
}
