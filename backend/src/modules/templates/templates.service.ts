import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";
import { CreateTemplateInput, UpdateTemplateInput } from "./templates.schema";

export async function listTemplates() {
  return prisma.messageTemplate.findMany({
    include: { mediaAsset: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTemplate(templateId: string) {
  const template = await prisma.messageTemplate.findUnique({
    where: { id: templateId },
    include: { mediaAsset: true },
  });
  if (!template) throw new NotFoundError("Template not found");
  return template;
}

export async function createTemplate(input: CreateTemplateInput, createdById: string) {
  return prisma.messageTemplate.create({ data: { ...input, createdById } });
}

export async function updateTemplate(templateId: string, input: UpdateTemplateInput) {
  await getTemplate(templateId);
  return prisma.messageTemplate.update({ where: { id: templateId }, data: input });
}

export async function deleteTemplate(templateId: string) {
  await getTemplate(templateId);
  await prisma.messageTemplate.delete({ where: { id: templateId } });
}
