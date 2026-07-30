import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { UnauthorizedError, ValidationError } from "../../lib/errors";
import * as leadsService from "./leads.service";
import * as importService from "./import.service";
import { LeadListQuery, CustomerListQuery } from "./leads.schema";

/**
 * `forceNew` is honoured for any user with "leads" write access — including a CR whose
 * role restricts them to their own leads. That restriction only ever gates who can EDIT
 * an enquiry (see requireEnquiryOwnership); it's not a reason to stop a CR from logging a
 * new enquiry for a returning customer, since the new enquiry auto-assigns to that
 * customer's existing owning CR regardless of who creates it (see leads.service.ts
 * createOrAttachEnquiry's Lead.primaryCrId inheritance) — never to the creator.
 */
function withCheckedForceNew(body: Record<string, unknown>, user: Express.Request["user"]) {
  if (!body.forceNew || !user) return body;
  const canForceNew = user.role === "SUPER_ADMIN" || user.permissions.leads === "write";
  return { ...body, forceNew: canForceNew };
}

export async function createEnquiryHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const body = withCheckedForceNew(req.body, req.user);
  const result = await leadsService.createOrAttachEnquiry(body as typeof req.body, req.user.id);
  res.status(201).json(result);
}

export async function createWalkInHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const body = withCheckedForceNew({ ...req.body, source: "WALK_IN" }, req.user);
  const result = await leadsService.createOrAttachEnquiry(body as typeof req.body, req.user.id);
  res.status(201).json(result);
}

export async function listEnquiriesHandler(req: Request, res: Response) {
  const result = await leadsService.listEnquiries(req.query as unknown as LeadListQuery, req.branchFilter);
  res.json(result);
}

export async function listCustomersHandler(req: Request, res: Response) {
  const result = await leadsService.listCustomers(req.query as unknown as CustomerListQuery, req.branchFilter);
  res.json(result);
}

export async function getLeadHandler(req: Request, res: Response) {
  const lead = await leadsService.getLeadWithHistory(req.params.leadId);
  res.json(lead);
}

export async function importLeadsHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  if (!req.file) throw new ValidationError("No file uploaded");
  const branchId = req.body.branchId as string | undefined;
  if (!branchId) throw new ValidationError("branchId is required");

  const rows = await importService.parseLeadFile(req.file.buffer, req.file.originalname);
  const summary = await importService.importRows(rows, branchId, "GOOGLE_SHEETS", req.user.id);
  res.json(summary);
}

export async function downloadLeadImportTemplateHandler(req: Request, res: Response) {
  const buffer = await importService.generateLeadImportTemplate();
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="lead-import-template.xlsx"');
  res.send(buffer);
}

export async function listDraftsHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const drafts = await leadsService.listDrafts(req.user.id);
  res.json(drafts);
}

export async function saveDraftHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const draft = await leadsService.saveDraft(req.user.id, req.body.branchId, req.body.data as Prisma.InputJsonValue);
  res.status(201).json(draft);
}

export async function updateDraftHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const draft = await leadsService.updateDraft(req.params.id, req.user.id, req.body.data as Prisma.InputJsonValue);
  res.json(draft);
}

export async function deleteDraftHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  await leadsService.deleteDraft(req.params.id, req.user.id);
  res.status(204).send();
}

export async function lookupLeadHandler(req: Request, res: Response) {
  const phone = req.query.phone as string | undefined;
  if (!phone) throw new ValidationError("Phone number is required");
  
  const lead = await leadsService.lookupLeadByPhone(phone);
  res.json(lead);
}

export async function getRemindersHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const reminders = await leadsService.getReminders({
    id: req.user.id,
    restrictLeadsToOwn: req.user.restrictLeadsToOwn,
    canViewAllBranches: req.user.canViewAllBranches,
    branchId: req.user.branchId ?? null,
  });
  res.json(reminders);
}
