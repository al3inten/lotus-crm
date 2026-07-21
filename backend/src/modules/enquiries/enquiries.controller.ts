import { Request, Response } from "express";
import { UnauthorizedError } from "../../lib/errors";
import * as enquiriesService from "./enquiries.service";
import * as testDriveService from "./testDrive.service";
import * as quotationService from "./quotation.service";
import * as exchangeService from "./exchange.service";
import * as financeService from "./finance.service";
import * as deliveryService from "./delivery.service";
import * as commentsService from "./comments.service";

export async function getEnquiryHandler(req: Request, res: Response) {
  const enquiry = await enquiriesService.getEnquiry(req.params.enquiryId);
  res.json(enquiry);
}

export async function changeStatusHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const enquiry = await enquiriesService.changeStatus(req.params.enquiryId, req.body, req.user.id);
  res.json(enquiry);
}

export async function updateDetailsHandler(req: Request, res: Response) {
  const enquiry = await enquiriesService.updateEnquiryDetails(req.params.enquiryId, req.body);
  res.json(enquiry);
}

export async function updateBookingHandler(req: Request, res: Response) {
  const enquiry = await enquiriesService.updateBookingDetails(req.params.enquiryId, req.body);
  res.json(enquiry);
}

export async function reassignHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const enquiry = await enquiriesService.reassign(req.params.enquiryId, req.body, req.user.id);
  res.json(enquiry);
}

export async function testDriveHandler(req: Request, res: Response) {
  const result = await testDriveService.addTestDrive(req.params.enquiryId, req.body);
  res.status(201).json(result);
}

export async function updateTestDriveHandler(req: Request, res: Response) {
  const result = await testDriveService.updateTestDrive(req.params.enquiryId, req.params.testDriveId, req.body);
  res.json(result);
}

export async function quotationHandler(req: Request, res: Response) {
  const result = await quotationService.upsertQuotation(req.params.enquiryId, req.body);
  res.json(result);
}

export async function exchangeHandler(req: Request, res: Response) {
  const result = await exchangeService.upsertExchangeEvaluation(req.params.enquiryId, req.body);
  res.json(result);
}

export async function financeHandler(req: Request, res: Response) {
  const result = await financeService.upsertFinanceApplication(req.params.enquiryId, req.body);
  res.json(result);
}

export async function deliveryHandler(req: Request, res: Response) {
  const result = await deliveryService.upsertDeliveryDetails(req.params.enquiryId, req.body);
  res.json(result);
}

export async function addFollowUpHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const result = await enquiriesService.addFollowUp(req.params.enquiryId, req.body, req.user.id);
  res.status(201).json(result);
}

export async function getCommentsHandler(req: Request, res: Response) {
  const comments = await commentsService.getComments(req.params.enquiryId);
  res.json(comments);
}

export async function addCommentHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const comment = await commentsService.addComment(req.params.enquiryId, req.user.id, req.body);
  res.status(201).json(comment);
}
