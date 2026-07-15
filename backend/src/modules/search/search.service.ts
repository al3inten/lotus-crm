import { prisma } from "../../lib/prisma";

const RESULT_LIMIT = 5;

export async function globalSearch(query: string, branchFilter?: { branchId: string }) {
  const q = query.trim();
  if (q.length < 2) {
    return { leads: [], vehicles: [] };
  }

  const branchWhere = branchFilter ? { branchId: branchFilter.branchId } : {};

  const [enquiries, vehicleModels] = await Promise.all([
    prisma.enquiry.findMany({
      where: {
        ...branchWhere,
        OR: [
          { lead: { name: { contains: q, mode: "insensitive" } } },
          { lead: { phoneRaw: { contains: q, mode: "insensitive" } } },
          { lead: { email: { contains: q, mode: "insensitive" } } },
          { carModel: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        leadId: true,
        carModel: true,
        status: true,
        lead: { select: { name: true, phoneRaw: true } },
        branch: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: RESULT_LIMIT,
    }),
    prisma.vehicleModel.findMany({
      where: { name: { contains: q, mode: "insensitive" }, isActive: true },
      select: { id: true, name: true },
      take: RESULT_LIMIT,
    }),
  ]);

  return {
    leads: enquiries.map((e) => ({
      enquiryId: e.id,
      leadId: e.leadId,
      name: e.lead.name,
      phone: e.lead.phoneRaw,
      carModel: e.carModel,
      status: e.status,
      branchName: e.branch.name,
    })),
    vehicles: vehicleModels.map((v) => ({ id: v.id, name: v.name })),
  };
}
