import { Request, Response } from "express";
import { UnauthorizedError, ValidationError } from "../../lib/errors";
import * as integrationsService from "./integrations.service";
import * as googleSheetsService from "./googleSheets.service";
import { CREDENTIAL_SCHEMAS, IntegrationKey } from "./integrations.schema";

// Derived from the schema map so adding a new integration can't silently miss this list.
const VALID_KEYS = new Set(Object.keys(CREDENTIAL_SCHEMAS));

function parseKey(raw: string): IntegrationKey {
  if (!VALID_KEYS.has(raw)) throw new ValidationError(`Unknown integration key: ${raw}`);
  return raw as IntegrationKey;
}

export async function listIntegrationsHandler(_req: Request, res: Response) {
  const configs = await integrationsService.listConfigs();
  res.json(configs);
}

export async function saveIntegrationHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const key = parseKey(req.params.key);
  await integrationsService.saveCredentials(key, req.body.credentials, req.user.id);
  res.status(204).send();
}

export async function deleteIntegrationHandler(req: Request, res: Response) {
  const key = parseKey(req.params.key);
  await integrationsService.deleteCredentials(key);
  res.status(204).send();
}

export async function testIntegrationHandler(req: Request, res: Response) {
  const key = parseKey(req.params.key);
  const result = await integrationsService.testConnection(key);
  res.json(result);
}

export async function toggleIntegrationHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const key = parseKey(req.params.key);
  await integrationsService.setEnabled(key, req.body.enabled, req.user.id);
  res.status(204).send();
}

export async function syncGoogleSheetHandler(req: Request, res: Response) {
  if (!req.user) throw new UnauthorizedError();
  const { sheetUrl, sheetName, branchId } = req.body;
  const summary = await googleSheetsService.syncFromSheet(sheetUrl, sheetName, branchId, req.user.id);
  res.json(summary);
}
