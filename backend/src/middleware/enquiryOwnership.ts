import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

/**
 * Branch scoping only — unless the user is SUPER_ADMIN or has canViewAllBranches, the
 * enquiry must belong to their own branch. Mounted on GET so that viewing an enquiry never
 * enforces restrictLeadsToOwn: every CR can see any lead in their branch, regardless of who
 * it's assigned to — only acting on it is restricted (see requireEnquiryOwnership below).
 */
export async function requireEnquiryBranchScope(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.enquiryId },
    select: { branchId: true },
  });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  if (req.user.role !== "SUPER_ADMIN" && !req.user.canViewAllBranches && enquiry.branchId !== req.user.branchId) {
    throw new NotFoundError("Enquiry not found");
  }

  next();
}

/**
 * Two independent checks, both scoped to req.user, for routes that mutate an enquiry:
 *  - Branch: same as requireEnquiryBranchScope above.
 *  - Ownership: a user whose role has restrictLeadsToOwn set may only act on leads
 *    assigned to them — everyone else is unrestricted here.
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
