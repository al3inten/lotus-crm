import { prisma } from "../../lib/prisma";
import { encryptJson, decryptJson } from "../../lib/crypto";

export interface FacebookPageRef {
  id: string;
  name: string;
  access_token: string;
}

export async function listMetaAdsPages() {
  const pages = await prisma.metaAdsPage.findMany({ orderBy: { pageName: "asc" } });
  return pages.map((page) => ({
    pageId: page.pageId,
    pageName: page.pageName,
    leadFormCount: page.leadFormCount,
    webhookSubscribed: page.webhookSubscribed,
    lastSyncedAt: page.lastSyncedAt,
  }));
}

export async function getMetaAdsPageAccessToken(pageId: string): Promise<string | null> {
  const page = await prisma.metaAdsPage.findUnique({ where: { pageId } });
  if (!page) return null;
  return decryptJson<string>(page.encryptedAccessToken);
}

/** Upserts the given Pages and removes any previously-connected Page no longer returned by Facebook. */
export async function upsertMetaAdsPages(pages: FacebookPageRef[]) {
  const seenPageIds = pages.map((page) => page.id);

  await prisma.$transaction([
    ...pages.map((page) =>
      prisma.metaAdsPage.upsert({
        where: { pageId: page.id },
        create: {
          pageId: page.id,
          pageName: page.name,
          encryptedAccessToken: encryptJson(page.access_token),
        },
        update: {
          pageName: page.name,
          encryptedAccessToken: encryptJson(page.access_token),
        },
      })
    ),
    prisma.metaAdsPage.deleteMany({ where: { pageId: { notIn: seenPageIds } } }),
  ]);
}

export async function setPageWebhookSubscribed(pageId: string, subscribed: boolean) {
  await prisma.metaAdsPage.update({ where: { pageId }, data: { webhookSubscribed: subscribed } });
}

export async function setPageLeadFormCount(pageId: string, leadFormCount: number) {
  await prisma.metaAdsPage.update({ where: { pageId }, data: { leadFormCount } });
}

export async function touchPageSync(pageId: string) {
  await prisma.metaAdsPage.update({ where: { pageId }, data: { lastSyncedAt: new Date() } });
}

export async function deleteAllMetaAdsPages() {
  await prisma.metaAdsPage.deleteMany({});
}
