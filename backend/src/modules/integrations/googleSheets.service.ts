import { google } from "googleapis";
import { ValidationError } from "../../lib/errors";
import * as integrationsService from "./integrations.service";
import * as importService from "../leads/import.service";

function extractSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : urlOrId;
}

export async function syncFromSheet(
  sheetUrlOrId: string,
  sheetName: string | undefined,
  branchId: string,
  createdById: string
) {
  const creds = await integrationsService.getGoogleSheetsCredentials();
  const serviceAccount = JSON.parse(creds.serviceAccountJson);

  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = extractSpreadsheetId(sheetUrlOrId);
  const range = sheetName ? `${sheetName}` : "A1:Z10000";

  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const values = data.values;
  if (!values || values.length < 2) {
    throw new ValidationError("Sheet has no data rows (or the range/tab name is wrong)");
  }

  const [headerRow, ...dataRows] = values;
  const headerMap = importService.buildHeaderMap(headerRow);
  const rows = dataRows.map((cells) => importService.rowsFromCells(headerMap, cells));

  return importService.importRows(rows, branchId, "GOOGLE_SHEETS", createdById);
}
