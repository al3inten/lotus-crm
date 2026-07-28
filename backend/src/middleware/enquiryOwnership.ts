import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../lib/errors";

/**
 * A user whose role has restrictLeadsToOwn set can view every lead, but may only act
 * on ones assigned to them — everyone else is unrestricted here. `isCr` is additive:
 * a user flagged isCr may also act on leads assigned to them via assignedCrId even if
 * their own role's restriction would otherwise block it (this only ever widens access,
 * since the assignedCrId check below already covers "assigned to me"). Applied to every
 * mutating route under /enquiries/:enquiryId (status/details/booking/retail/rto/delivery/
 * test-drive/quotation/exchange/finance/follow-ups/comments) — GET routes are left open so
 * an unassigned lead still renders read-only rather than 404/403ing on load.
 */
export async function requireEnquiryOwnership(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();
  if (!req.user.restrictLeadsToOwn) return next();

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: req.params.enquiryId },
    select: { assignedCrId: true },
  });
  if (!enquiry) throw new NotFoundError("Enquiry not found");
  if (enquiry.assignedCrId !== req.user.id) {
    throw new ForbiddenError("You can only make changes to leads assigned to you.");
  }
  next();
}
