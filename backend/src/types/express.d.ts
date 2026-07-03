import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  role: Role;
  branchId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      branchFilter?: { branchId: string } | undefined;
      rawBody?: Buffer;
    }
  }
}

export {};
