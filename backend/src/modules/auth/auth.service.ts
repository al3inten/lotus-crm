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

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

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

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { token, user: safeUser };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { branch: true },
  });
  if (!user) throw new UnauthorizedError("User no longer exists");
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
