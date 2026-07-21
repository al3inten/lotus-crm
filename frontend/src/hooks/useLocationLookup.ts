import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface PincodeLookupResult {
  city: string;
  state: string;
  areas: string[];
}

/** India Post's public pincode API — no key required. Given a 6-digit pincode, returns the
 * district/city, state, and the list of post-office (locality) names serving that pincode,
 * so the wizard can auto-fill City and suggest Area options as the CR types the pincode. */
async function fetchPincodeDetails(pincode: string): Promise<PincodeLookupResult | null> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!res.ok) return null;
  const data = await res.json();
  const record = data?.[0];
  if (record?.Status !== "Success" || !record.PostOffice?.length) return null;

  const offices = record.PostOffice as Array<{ Name: string; District: string; State: string }>;
  return {
    city: offices[0].District,
    state: offices[0].State,
    areas: [...new Set(offices.map((o) => o.Name))],
  };
}

export function usePincodeLookup(pincode: string) {
  const isSixDigits = /^\d{6}$/.test(pincode);
  return useQuery({
    queryKey: ["pincode-lookup", pincode],
    queryFn: () => fetchPincodeDetails(pincode),
    enabled: isSixDigits,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}

interface PostOfficeMatch {
  name: string;
  pincode: string;
  city: string;
  state: string;
}

/** India Post's "search by name" endpoint — given a partial area/city name, returns matching
 * post offices with their pincodes, so the wizard can suggest Pincode options as the CR types
 * the Area or City field (the reverse direction of the pincode lookup above). */
async function searchPostOffices(query: string): Promise<PostOfficeMatch[]> {
  const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  const record = data?.[0];
  if (record?.Status !== "Success" || !record.PostOffice?.length) return [];

  const offices = record.PostOffice as Array<{ Name: string; Pincode: string; District: string; State: string }>;
  return offices.map((o) => ({ name: o.Name, pincode: o.Pincode, city: o.District, state: o.State }));
}

/** Debounces a fast-changing value (e.g. keystrokes) so dependent queries don't fire on
 * every keypress. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** Ranks free-text suggestions against what the CR has typed so far — exact match first,
 * then "starts with", then "contains" anywhere, ties broken by shorter (more specific) values
 * — and caps the list so the dropdown stays a quick scan instead of a wall of matches. */
export function rankSuggestions<T extends { value: string }>(options: T[], query: string, limit = 6): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);

  const score = (value: string) => {
    const v = value.toLowerCase();
    if (v === q) return 0;
    if (v.startsWith(q)) return 1;
    if (v.includes(q)) return 2;
    return 3;
  };

  return options
    .map((opt) => ({ opt, s: score(opt.value) }))
    .filter(({ s }) => s < 3)
    .sort((a, b) => a.s - b.s || a.opt.value.length - b.opt.value.length)
    .slice(0, limit)
    .map(({ opt }) => opt);
}

export function usePostOfficeSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 400);
  const isSearchable = debounced.length >= 3 && !/^\d+$/.test(debounced);
  return useQuery({
    queryKey: ["postoffice-search", debounced],
    queryFn: () => searchPostOffices(debounced),
    enabled: isSearchable,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}
