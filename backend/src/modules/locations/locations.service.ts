import { prisma } from "../../lib/prisma";

interface PostOfficeRecord {
  pincode: string;
  name: string;
  city: string;
  state: string;
}

// India Post's public pincode directory — unofficial but the de-facto standard free source
// for this data in the Indian dev ecosystem. Called only as a cache-miss fallback; results
// are persisted to our own `post_offices` table so this external dependency shrinks over time.
const UPSTREAM_BASE = "https://api.postalpincode.in";

async function fetchFromUpstream(path: string): Promise<PostOfficeRecord[]> {
  const res = await fetch(`${UPSTREAM_BASE}${path}`);
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ Status: string; PostOffice?: Array<{ Name: string; Pincode: string; District: string; State: string }> }>;
  const record = data?.[0];
  if (record?.Status !== "Success" || !record.PostOffice?.length) return [];
  return record.PostOffice.map((o) => ({ pincode: o.Pincode, name: o.Name, city: o.District, state: o.State }));
}

async function cacheRecords(records: PostOfficeRecord[]) {
  if (!records.length) return;
  await prisma.postOffice.createMany({
    data: records,
    skipDuplicates: true,
  });
}

/** Given a 6-digit pincode, returns its district/city, state, and the post-office
 * (locality/"Area") names serving it — cache-first, falling back to the live API. */
export async function lookupPincode(pincode: string) {
  let rows = await prisma.postOffice.findMany({ where: { pincode } });

  if (rows.length === 0) {
    const fetched = await fetchFromUpstream(`/pincode/${pincode}`);
    await cacheRecords(fetched);
    rows = fetched.length ? await prisma.postOffice.findMany({ where: { pincode } }) : [];
  }

  if (rows.length === 0) return null;
  return {
    city: rows[0].city,
    state: rows[0].state,
    areas: [...new Set(rows.map((r) => r.name))],
  };
}

/** Given partial text typed into Area or City, returns matching post offices (name,
 * pincode, city, state) — cache-first; only calls the live API when the cache doesn't
 * already have enough to show. */
export async function searchByName(query: string) {
  const cached = await prisma.postOffice.findMany({
    where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { city: { contains: query, mode: "insensitive" } }] },
    take: 25,
  });

  if (cached.length >= 5) return cached;

  const fetched = await fetchFromUpstream(`/postoffice/${encodeURIComponent(query)}`);
  await cacheRecords(fetched);
  if (!fetched.length) return cached;

  const merged = await prisma.postOffice.findMany({
    where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { city: { contains: query, mode: "insensitive" } }] },
    take: 25,
  });
  return merged;
}
