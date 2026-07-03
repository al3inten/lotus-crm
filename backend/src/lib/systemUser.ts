import crypto from "crypto";
import { prisma } from "./prisma";
import { hashPassword } from "../modules/auth/auth.service";

const SYSTEM_USER_EMAIL = "system@lotuscrm.internal";

let cachedSystemUserId: string | null = null;

/**
 * Webhook-driven writes (Meta/WhatsApp/Instagram capture) have no logged-in user, but
 * EnquiryStatusHistory.changedById is a required FK. This reserved account attributes
 * those automated writes instead of requiring the schema to make the FK nullable.
 */
export async function getSystemUserId(): Promise<string> {
  if (cachedSystemUserId) return cachedSystemUserId;

  const existing = await prisma.user.findUnique({ where: { email: SYSTEM_USER_EMAIL } });
  if (existing) {
    cachedSystemUserId = existing.id;
    return existing.id;
  }

  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
  const created = await prisma.user.create({
    data: {
      name: "Lotus CRM Integrations",
      email: SYSTEM_USER_EMAIL,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: false,
      isAvailableForRouting: false,
    },
  });
  cachedSystemUserId = created.id;
  return created.id;
}
