import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../lib/errors";
import { LoginInput } from "./auth.schema";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function toSafeUser(user: {
  passwordHash: string;
  roleDefinition?: { name: string; permissions: unknown; isActive: boolean } | null;
  [key: string]: unknown;
}) {
  const { passwordHash: _passwordHash, roleDefinition, ...rest } = user;
  return {
    ...rest,
    roleName: roleDefinition?.isActive ? roleDefinition.name : null,
    // null = no custom role, frontend falls back to base-role defaults
    permissions: roleDefinition?.isActive ? (roleDefinition.permissions as string[]) : null,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { roleDefinition: { select: { name: true, permissions: true, isActive: true } } },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, branchId: user.branchId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  return { token, user: toSafeUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      branch: true,
      roleDefinition: { select: { name: true, permissions: true, isActive: true } },
    },
  });
  if (!user) throw new UnauthorizedError("User no longer exists");
  return toSafeUser(user);
}
