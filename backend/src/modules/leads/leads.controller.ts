import { Request, Response } from "express";
import { UnauthorizedError, ValidationError } from "../../lib/errors";
import * as leadsService from "./leads.service";
import * as importService from "./import.service";
import { LeadListQuery } from "./leads.schema";

export async function createEnquiryHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await leadsService.createOrAttachEnquiry(req.body, req.user.id);
  res.status(201).json(result);
}

export async function createWalkInHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await leadsService.createOrAttachEnquiry(
    { ...req.body, source: "WALK_IN" },
    req.user.id
  );
  res.status(201).json(result);
}

export async function listEnquiriesHandler(req: Request, res: Response) {
  const result = await leadsService.listEnquiries(req.query as unknown as LeadListQuery, req.branchFilter);
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
