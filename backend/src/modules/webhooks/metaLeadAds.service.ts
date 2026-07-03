import axios from "axios";
import { logger } from "../../lib/logger";
import { getSystemUserId } from "../../lib/systemUser";
import * as leadsService from "../leads/leads.service";
import * as integrationsService from "../integrations/integrations.service";

const GRAPH_API_BASE = "https://graph.facebook.com/v19.0";

interface LeadFieldData {
  name: string;
  values: string[];
}

interface MetaLeadResponse {
  id: string;
  field_data: LeadFieldData[];
}

function extractField(fieldData: LeadFieldData[], candidates: string[]): string | undefined {
  for (const field of fieldData) {
    const key = field.name.toLowerCase().replace(/[^a-z]/g, "");
    if (candidates.some((c) => key.includes(c))) {
      return field.values?.[0];
    }
  }
  return undefined;
}

/**
 * The leadgen webhook only tells us a leadgen_id changed — the actual answers have to be
 * fetched separately from the Graph API using the Page Access Token for that page/form.
 */
export async function handleLeadgenEvent(leadgenId: string) {
  const creds = await integrationsService.getMetaAdsCredentials();

  const { data } = await axios.get<MetaLeadResponse>(`${GRAPH_API_BASE}/${leadgenId}`, {
    params: { access_token: creds.pageAccessToken },
  });

  const name = extractField(data.field_data, ["fullname", "name"]) ?? "Meta Lead";
  const phone = extractField(data.field_data, ["phone", "mobile", "contact"]);
  const email = extractField(data.field_data, ["email"]);
  const carModel = extractField(data.field_data, ["car", "model", "vehicle"]) ?? "Not specified";
  const location = extractField(data.field_data, ["city", "location", "area"]);

  if (!phone) {
    logger.warn("Meta lead has no phone field — skipping auto-capture", { leadgenId });
    return null;
  }

  const systemUserId = await getSystemUserId();

  return leadsService.createOrAttachEnquiry(
    {
      name,
      phone,
      email,
      carModel,
      source: "META_ADS",
      enquiryType: "NEW_CAR",
      location,
      branchId: await resolveDefaultBranchId(),
    },
    systemUserId
  );
}

// Meta Lead Ads forms aren't tied to a specific showroom branch — route to whichever
// branch is configured as the default intake point; CR/Branch Manager can reassign after.
async function resolveDefaultBranchId(): Promise<string> {
  const { prisma } = await import("../../lib/prisma");
  const branch = await prisma.branch.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  if (!branch) throw new Error("No active branch exists to route Meta leads into");
  return branch.id;
}
