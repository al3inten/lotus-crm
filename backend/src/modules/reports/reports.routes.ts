import { NextFunction, Request, Response, Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { applyBranchScope } from "../../middleware/branchScope";
import { validateQuery } from "../../middleware/validate";
import { UnauthorizedError } from "../../lib/errors";
import { reportQuerySchema, trendQuerySchema, breakdownQuerySchema, customerPreviewQuerySchema, misReportQuerySchema } from "./reports.schema";
import {
  summaryHandler,
  crPerformanceHandler,
  branchRollupHandler,
  trendHandler,
  yoyHandler,
  funnelHandler,
  timeInStageHandler,
  callAnalysisHandler,
  sourcePerformanceHandler,
  referralLeadsHandler,
  referralPerformanceHandler,
  lostReasonsHandler,
  consultantPerformanceHandler,
  vehiclePerformanceHandler,
  modelWiseReportHandler,
  sourceWiseReportHandler,
  breakdownHandler,
  exportCsvHandler,
  exportXlsxHandler,
  previewCustomersHandler,
} from "./reports.controller";

const router = Router();

router.use(verifyJwt, applyBranchScope);

/**
 * The Dashboard's stat ledger needs summary/trend/yoy/source-performance even for
 * users with no "reports" access — but only their OWN numbers, never the team's.
 * With reports access, both scopes are allowed (whatever assignedCrId the caller asks
 * for, including none = everyone in scope). Without it, assignedCrId is forced to the
 * caller's own id regardless of what was requested — never a 403, just narrowed.
 */
function selfScopedWithoutReportsAccess(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw new UnauthorizedError();
  const hasReportsAccess = req.user.role === "SUPER_ADMIN" || req.user.permissions.reports === "read" || req.user.permissions.reports === "write";
  if (!hasReportsAccess) {
    req.query.assignedCrId = req.user.id;
  }
  next();
}

router.get("/summary", selfScopedWithoutReportsAccess, validateQuery(reportQuerySchema), asyncHandler(summaryHandler));
router.get("/trend", selfScopedWithoutReportsAccess, validateQuery(trendQuerySchema), asyncHandler(trendHandler));
router.get("/yoy", selfScopedWithoutReportsAccess, validateQuery(reportQuerySchema), asyncHandler(yoyHandler));
router.get("/source-performance", selfScopedWithoutReportsAccess, validateQuery(reportQuerySchema), asyncHandler(sourcePerformanceHandler));

router.get("/cr-performance", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(crPerformanceHandler));
router.get("/branch-rollup", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(branchRollupHandler));
router.get("/funnel", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(funnelHandler));
router.get("/time-in-stage", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(timeInStageHandler));
router.get("/call-analysis", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(callAnalysisHandler));
router.get("/referral-leads", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(referralLeadsHandler));
router.get("/referral-performance", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(referralPerformanceHandler));
router.get("/lost-reasons", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(lostReasonsHandler));
router.get("/vehicle-performance", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(vehiclePerformanceHandler));
router.get("/model-wise", requirePermission("reports", "read"), validateQuery(misReportQuerySchema), asyncHandler(modelWiseReportHandler));
router.get("/source-wise", requirePermission("reports", "read"), validateQuery(misReportQuerySchema), asyncHandler(sourceWiseReportHandler));
router.get("/consultant-performance", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(consultantPerformanceHandler));
router.get("/breakdown", requirePermission("reports", "read"), validateQuery(breakdownQuerySchema), asyncHandler(breakdownHandler));
router.get("/export", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(exportCsvHandler));
router.get("/export.xlsx", requirePermission("reports", "read"), validateQuery(reportQuerySchema), asyncHandler(exportXlsxHandler));
router.get("/customers", requirePermission("reports", "read"), validateQuery(customerPreviewQuerySchema), asyncHandler(previewCustomersHandler));

export default router;
