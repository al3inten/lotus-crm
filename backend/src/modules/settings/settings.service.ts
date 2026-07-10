import { prisma } from "../../lib/prisma";

export async function getSystemSettings() {
  let settings = await prisma.systemSettings.findUnique({
    where: { id: "singleton" },
  });
  
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: { id: "singleton", quotationEnabled: true },
    });
  }
  
  return settings;
}

export async function updateSystemSettings(data: { quotationEnabled: boolean }) {
  return prisma.systemSettings.upsert({
    where: { id: "singleton" },
    update: { quotationEnabled: data.quotationEnabled },
    create: { id: "singleton", quotationEnabled: data.quotationEnabled },
  });
}
