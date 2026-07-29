import { Role } from "@prisma/client";
import { PermissionsMap } from "../config/constants";

export interface AuthUser {
  id: string;
  role: Role;
  branchId: string | null;
  permissions: PermissionsMap;
  canViewAllBranches: boolean;
  restrictLeadsToOwn: boolean;
  /** Only meaningful when restrictLeadsToOwn is true: lets this user view (not edit) leads
   * assigned to other CRs in their own branch, instead of only their own. */
  canViewBranchLeads: boolean;
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
