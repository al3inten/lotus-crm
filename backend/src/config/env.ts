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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — check backend/.env against .env.example");
}

export const env = parsed.data;
