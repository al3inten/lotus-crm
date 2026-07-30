import { Role } from "@prisma/client";
import { PermissionsMap } from "../config/constants";

export interface AuthUser {
  id: string;
  role: Role;
  branchId: string | null;
  permissions: PermissionsMap;
  canViewAllBranches: boolean;
  restrictLeadsToOwn: boolean;
  canReassignCustomerCr: boolean;
  isCr: boolean;
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
