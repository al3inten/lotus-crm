import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import { ValidationError } from "../../lib/errors";
import * as leadsService from "./leads.service";
import { EnquiryType, LeadSource } from "@prisma/client";

export interface ImportedRow {
  name?: string;
  phone?: string;
  email?: string;
  carModel?: string;
  enquiryType?: string;
  location?: string;
}

interface ImportRowResult {
  row: number;
  status: "created" | "merged" | "error";
  message?: string;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  merged: number;
  failed: number;
  errors: { row: number; message: string }[];
}

const VALID_ENQUIRY_TYPES = new Set<EnquiryType>(["NEW_CAR", "USED_CAR", "SERVICE_RELATED", "ACCESSORY", "OTHER"]);

const HEADER_ALIASES: Record<keyof ImportedRow, string[]> = {
  name: ["name", "leadname", "customername", "fullname"],
  phone: ["phone", "phonenumber", "mobile", "mobilenumber", "contact", "contactnumber"],
  email: ["email", "emailaddress"],
  carModel: ["carmodel", "car", "carname", "model", "vehicle"],
  enquiryType: ["enquirytype", "type", "leadtype"],
  location: ["location", "city", "area"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function buildHeaderMap(headers: string[]): Partial<Record<keyof ImportedRow, number>> {
  const map: Partial<Record<keyof ImportedRow, number>> = {};
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [keyof ImportedRow, string[]][]) {
      if (aliases.includes(normalized) && map[field] === undefined) {
        map[field] = index;
      }
    }
  });
  return map;
}

export function rowsFromCells(headerMap: Partial<Record<keyof ImportedRow, number>>, cells: unknown[]): ImportedRow {
  const get = (field: keyof ImportedRow): string | undefined => {
    const idx = headerMap[field];
    if (idx === undefined) return undefined;
    const value = cells[idx];
    return value === undefined || value === null ? undefined : String(value).trim();
  };
  return {
    name: get("name"),
    phone: get("phone"),
    email: get("email"),
    carModel: get("carModel"),
    enquiryType: get("enquiryType"),
    location: get("location"),
  };
}

async function parseXlsx(buffer: Buffer): Promise<ImportedRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1).values as unknown[];
  const headers = headerRow.slice(1).map((h) => String(h ?? ""));
  const headerMap = buildHeaderMap(headers);

  const rows: ImportedRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells = (row.values as unknown[]).slice(1);
    rows.push(rowsFromCells(headerMap, cells));
  });
  return rows;
}

function parseCsvBuffer(buffer: Buffer): ImportedRow[] {
  const records: string[][] = parseCsv(buffer, { skip_empty_lines: true });
  if (records.length === 0) return [];
  const headerMap = buildHeaderMap(records[0]);
  return records.slice(1).map((cells) => rowsFromCells(headerMap, cells));
}

export async function parseLeadFile(buffer: Buffer, filename: string): Promise<ImportedRow[]> {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext === "csv") return parseCsvBuffer(buffer);
  if (ext === "xlsx" || ext === "xls") return parseXlsx(buffer);
  throw new ValidationError("Unsupported file type — upload a .csv or .xlsx file");
}

const TEMPLATE_COLUMNS: { header: string; key: keyof ImportedRow; width: number }[] = [
  { header: "Name", key: "name", width: 22 },
  { header: "Phone", key: "phone", width: 16 },
  { header: "Email", key: "email", width: 26 },
  { header: "Car Model", key: "carModel", width: 18 },
  { header: "Enquiry Type", key: "enquiryType", width: 16 },
  { header: "Location", key: "location", width: 18 },
];

const TEMPLATE_EXAMPLE_ROW: Record<keyof ImportedRow, string> = {
  name: "John Doe",
  phone: "9876543210",
  email: "john@example.com",
  carModel: "Creta",
  enquiryType: "NEW_CAR",
  location: "Kochi",
};

export async function generateLeadImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Leads");
  sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(TEMPLATE_EXAMPLE_ROW);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function importRows(
  rows: ImportedRow[],
  branchId: string,
  source: LeadSource,
  createdById: string
): Promise<ImportSummary> {
  const results: ImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2; // account for header row + 1-indexing
    const row = rows[i];

    try {
      if (!row.name || !row.phone || !row.carModel) {
        throw new ValidationError("Missing required field (name, phone, or car model)");
      }

      const enquiryType = VALID_ENQUIRY_TYPES.has(row.enquiryType?.toUpperCase() as EnquiryType)
        ? (row.enquiryType!.toUpperCase() as EnquiryType)
        : "OTHER";

      const { isRepeatLead } = await leadsService.createOrAttachEnquiry(
        {
          name: row.name,
          phone: row.phone,
          email: row.email,
          carModel: row.carModel,
          enquiryType,
          location: row.location,
          source,
          branchId,
        },
        createdById
      );

      results.push({ row: rowNumber, status: isRepeatLead ? "merged" : "created" });
    } catch (err) {
      results.push({
        row: rowNumber,
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return {
    totalRows: rows.length,
    created: results.filter((r) => r.status === "created").length,
    merged: results.filter((r) => r.status === "merged").length,
    failed: results.filter((r) => r.status === "error").length,
    errors: results.filter((r) => r.status === "error").map((r) => ({ row: r.row, message: r.message! })),
  };
}
