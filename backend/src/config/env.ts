import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Used to encrypt third-party integration credentials (Meta/WhatsApp/Instagram tokens,
  // Google service account keys) at rest in IntegrationConfig.encryptedCredentials.
  // Must be a 32-byte value, base64 or hex encoded — see backend/src/lib/crypto.ts.
  MASTER_ENCRYPTION_KEY: z.string().min(32, "MASTER_ENCRYPTION_KEY must be at least 32 characters"),

  // Phase 3 — optional, unused today. Declared so the "secrets are backend-only" pattern
  // is already established before the voice/chat agent code exists.
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Meta (Facebook) Lead Ads OAuth login — app-level config from the Meta Developer dashboard,
  // shared across every admin who connects a Facebook account. Optional so environments without
  // Meta configured yet still boot; the OAuth routes throw a clear error if used without these.
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  BACKEND_PUBLIC_URL: z.string().default("http://localhost:4000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — check backend/.env against .env.example");
}

export const env = parsed.data;
