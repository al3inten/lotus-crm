import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../lib/errors";
import { LoginInput } from "./auth.schema";
import { loadAuthUser } from "../../middleware/auth";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function toSafeUser(user: { passwordHash: string; [key: string]: unknown }) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { branch: true },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // JWT only carries the user id — permissions are always looked up fresh from the
  // DB on every request (see middleware/auth.ts verifyJwt) so a role edit takes
  // effect on the very next request without requiring re-login.
  const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

  const authUser = await loadAuthUser(user.id);

  return { token, user: { ...toSafeUser(user), ...authUser } };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { branch: true },
  });
  if (!user) throw new UnauthorizedError("User no longer exists");

  const authUser = await loadAuthUser(userId);
  if (!authUser) throw new UnauthorizedError("User no longer exists");

  return { ...toSafeUser(user), ...authUser };
}
