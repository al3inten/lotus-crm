import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { verifyJwt } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import { applyBranchScope } from "../../middleware/branchScope";
import { validateQuery } from "../../middleware/validate";
import { reportQuerySchema, trendQuerySchema, breakdownQuerySchema, customerPreviewQuerySchema } from "./reports.schema";
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
  breakdownHandler,
  exportCsvHandler,
  exportXlsxHandler,
  previewCustomersHandler,
} from "./reports.controller";

const router = Router();

router.use(verifyJwt, requirePermission("reports", "read"), applyBranchScope);

router.get("/summary", validateQuery(reportQuerySchema), asyncHandler(summaryHandler));
router.get("/cr-performance", validateQuery(reportQuerySchema), asyncHandler(crPerformanceHandler));
router.get("/branch-rollup", validateQuery(reportQuerySchema), asyncHandler(branchRollupHandler));
router.get("/trend", validateQuery(trendQuerySchema), asyncHandler(trendHandler));
router.get("/yoy", validateQuery(reportQuerySchema), asyncHandler(yoyHandler));
router.get("/funnel", validateQuery(reportQuerySchema), asyncHandler(funnelHandler));
router.get("/time-in-stage", validateQuery(reportQuerySchema), asyncHandler(timeInStageHandler));
router.get("/call-analysis", validateQuery(reportQuerySchema), asyncHandler(callAnalysisHandler));
router.get("/source-performance", validateQuery(reportQuerySchema), asyncHandler(sourcePerformanceHandler));
router.get("/referral-leads", validateQuery(reportQuerySchema), asyncHandler(referralLeadsHandler));
router.get("/referral-performance", validateQuery(reportQuerySchema), asyncHandler(referralPerformanceHandler));
router.get("/lost-reasons", validateQuery(reportQuerySchema), asyncHandler(lostReasonsHandler));
router.get("/vehicle-performance", validateQuery(reportQuerySchema), asyncHandler(vehiclePerformanceHandler));
router.get("/consultant-performance", validateQuery(reportQuerySchema), asyncHandler(consultantPerformanceHandler));
router.get("/breakdown", validateQuery(breakdownQuerySchema), asyncHandler(breakdownHandler));
router.get("/export", validateQuery(reportQuerySchema), asyncHandler(exportCsvHandler));
router.get("/export.xlsx", validateQuery(reportQuerySchema), asyncHandler(exportXlsxHandler));
router.get("/customers", validateQuery(customerPreviewQuerySchema), asyncHandler(previewCustomersHandler));

export default router;
