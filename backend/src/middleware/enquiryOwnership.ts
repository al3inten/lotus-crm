import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

/**
 * Two independent checks, both scoped to req.user:
 *  - Branch: unless the user is SUPER_ADMIN or has canViewAllBranches, the enquiry must
 *    belong to their own branch — applies to every route this is mounted on, including GET,
 *    since applyBranchScope (used for list/aggregate queries) isn't wired into this
 *    single-resource module at all.
 *  - Ownership: a user whose role has restrictLeadsToOwn set may additionally only act
 *    on leads assigned to them — everyone else is unrestricted here. `isCr` is additive:
 *    a user flagged isCr may also act on leads assigned to them via assignedCrId even if
 *    their own role's restriction would otherwise block it (this only ever widens access,
 *    since the assignedCrId check below already covers "assigned to me").
 */
export async function requireEnquiryOwnership(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.enquiryId },
    select: { assignedCrId: true, branchId: true },
  });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  if (req.user.role !== "SUPER_ADMIN" && !req.user.canViewAllBranches && enquiry.branchId !== req.user.branchId) {
    throw new NotFoundError("Enquiry not found");
  }

  if (!req.user.restrictLeadsToOwn) return next();
  if (enquiry.assignedCrId !== req.user.id) {
    throw new ForbiddenError("You can only make changes to leads assigned to you.");
  }
  next();
}
