import { getIndiaPincode } from "india-pincode";
import { prisma } from "../../lib/prisma";

interface PostOfficeRecord {
  pincode: string;
  name: string;
  city: string;
  state: string;
}

// Bundled offline dataset (165K+ post offices) — replaces the old live call to India Post's
// public API. Lookups are synchronous/local; results are still persisted to our own
// `post_offices` table so downstream callers keep hitting the cache first.
const pin = getIndiaPincode();

function fetchFromUpstream(pincode: string): PostOfficeRecord[] {
  const result = pin.getByPincode(pincode);
  if (!result.success || !result.data) return [];
  return result.data.data.map((o) => ({ pincode: o.pincode, name: o.area, city: o.district, state: o.state }));
}

function searchUpstream(query: string): PostOfficeRecord[] {
  const result = pin.search(query, { limit: 25 });
  if (!result.success || !result.data) return [];
  return result.data.data.map((o) => ({ pincode: o.pincode, name: o.area, city: o.district, state: o.state }));
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
    const fetched = fetchFromUpstream(pincode);
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

  const fetched = searchUpstream(query);
  await cacheRecords(fetched);
  if (!fetched.length) return cached;

  const merged = await prisma.postOffice.findMany({
    where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { city: { contains: query, mode: "insensitive" } }] },
    take: 25,
  });
  return merged;
}
