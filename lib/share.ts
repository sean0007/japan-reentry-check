import { PENDING, PERMITS, STATUSES, checkReentry, validDate, type CheckInput, type Pending, type Permit, type Status } from "./reentry";

export const PUBLIC_URL = "https://japan-reentry-check.vercel.app";

/** Share links: /r?s=mid_long&d=2026-12-20&e=2027-01-15[&p=renewal][&t=deemed][&x=permitExpiry][&r=returnDate] */
type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, key: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(key) ?? undefined;
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
}
function date(p: Params, key: string): string | null {
  const v = one(p, key);
  return v && validDate(v) ? v : null;
}

export type Shared = { status: Status; departureDate: string; periodExpiry: string | null; pending: Pending; permit: Permit; permitExpiry: string | null; returnDate: string | null };

export const EXAMPLE_SHARED: Shared = { status: "mid_long", departureDate: "2026-12-20", periodExpiry: "2027-01-15", pending: "renewal", permit: "deemed", permitExpiry: null, returnDate: "2027-02-10" };
export const EXAMPLE_PR: Shared = { status: "permanent", departureDate: "2026-12-25", periodExpiry: null, pending: "none", permit: "deemed", permitExpiry: null, returnDate: "2028-01-05" };

export function parseShared(p: Params): Shared | null {
  const status = one(p, "s");
  const d = date(p, "d");
  if (!status || !(STATUSES as readonly string[]).includes(status) || !d) return null;
  const pending = one(p, "p") ?? "none";
  const permit = one(p, "t") ?? "deemed";
  return {
    status: status as Status,
    departureDate: d,
    periodExpiry: date(p, "e"),
    pending: ((PENDING as readonly string[]).includes(pending) ? pending : "none") as Pending,
    permit: ((PERMITS as readonly string[]).includes(permit) ? permit : "deemed") as Permit,
    permitExpiry: date(p, "x"),
    returnDate: date(p, "r"),
  };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  q.set("s", s.status);
  q.set("d", s.departureDate);
  if (s.periodExpiry) q.set("e", s.periodExpiry);
  if (s.pending !== "none") q.set("p", s.pending);
  if (s.permit !== "deemed") q.set("t", s.permit);
  if (s.permitExpiry) q.set("x", s.permitExpiry);
  if (s.returnDate) q.set("r", s.returnDate);
  return q.toString();
}

export function toCheckInput(s: Shared): CheckInput {
  return { ...s };
}
export function safeCheck(s: Shared) {
  try {
    return checkReentry(toCheckInput(s));
  } catch {
    return null;
  }
}
export function resultPath(s: Shared): string {
  return `/r?${sharedQuery(s)}`;
}
export function ogPath(s: Shared): string {
  return `/og?${sharedQuery(s)}`;
}
export function isIndexable(s: Shared): boolean {
  return resultPath(s) === resultPath(EXAMPLE_SHARED) || resultPath(s) === resultPath(EXAMPLE_PR);
}
