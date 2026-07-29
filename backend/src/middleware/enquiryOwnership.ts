import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

async function loadScopedEnquiry(req: Request) {
  if (!req.user) throw new UnauthorizedError();

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.enquiryId },
    select: { assignedCrId: true, branchId: true },
  });
  if (!enquiry) throw new NotFoundError("Enquiry not found");

  // Branch: unless the user is SUPER_ADMIN or has canViewAllBranches, the enquiry must
  // belong to their own branch — applies to every route this (or requireEnquiryViewAccess)
  // is mounted on, including GET, since applyBranchScope (used for list/aggregate queries)
  // isn't wired into this single-resource module at all. NotFound (not Forbidden) so a
  // cross-branch id doesn't even confirm the enquiry exists.
  if (req.user.role !== "SUPER_ADMIN" && !req.user.canViewAllBranches && enquiry.branchId !== req.user.branchId) {
    throw new NotFoundError("Enquiry not found");
  }

  return enquiry;
}

/**
 * Gate for the GET /:enquiryId route. A user whose role has restrictLeadsToOwn set can
 * still view leads assigned to other CRs in their own branch if canViewBranchLeads is also
 * on (a separate, more permissive toggle — restrictLeadsToOwn alone locks both viewing and
 * acting to just "assigned to me"); everyone else is unrestricted here.
 */
export async function requireEnquiryViewAccess(req: Request, _res: Response, next: NextFunction) {
  const enquiry = await loadScopedEnquiry(req);
  if (!req.user!.restrictLeadsToOwn || req.user!.canViewBranchLeads) return next();
  if (enquiry.assignedCrId !== req.user!.id) {
    throw new ForbiddenError("You can only view leads assigned to you.");
  }
  next();
}

/**
 * Gate for every mutating route under /enquiries/:enquiryId (status/details/booking/retail/
 * rto/delivery/test-drive/quotation/exchange/finance/follow-ups/comments). A user whose role
 * has restrictLeadsToOwn set may only act on leads assigned to them — canViewBranchLeads
 * never widens this, it only ever affects viewing (see requireEnquiryViewAccess above).
 * `isCr` is additive: a user flagged isCr may also act on leads assigned to them via
 * assignedCrId even if their own role's restriction would otherwise block it (this only ever
 * widens access, since the assignedCrId check below already covers "assigned to me").
 */
export async function requireEnquiryOwnership(req: Request, _res: Response, next: NextFunction) {
  const enquiry = await loadScopedEnquiry(req);
  if (!req.user!.restrictLeadsToOwn) return next();
  if (enquiry.assignedCrId !== req.user!.id) {
    throw new ForbiddenError("You can only make changes to leads assigned to you.");
  }
  next();
}
