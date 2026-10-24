import { InputError, type Endpoint, type Input } from "./agent-api";
import { DISCLAIMER, PENDING, PERMITS, RuleInputError, STATUSES, checkReentry, type Pending, type Permit, type Status } from "./reentry";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-reentry-check.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?status=mid_long&departureDate=2026-12-20&periodExpiry=2027-01-15&pending=renewal&returnDate=2027-02-10";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function s(v: unknown): string | null {
  const f = first(v);
  return f === undefined || f === null || String(f).trim() === "" ? null : String(f).trim();
}

const STATUS_ALIASES: Record<string, Status> = {
  resident: "mid_long", residence_card: "mid_long", midlong: "mid_long", mid_to_long: "mid_long", work: "mid_long", student: "mid_long", spouse: "mid_long", 中長期: "mid_long", 中長期在留者: "mid_long",
  pr: "permanent", permanent_resident: "permanent", 永住: "permanent", 永住者: "permanent",
  special_permanent: "spr", special_permanent_resident: "spr", 特別永住者: "spr",
  tourist: "short_term", visitor: "short_term", temporary_visitor: "short_term", short_stay: "short_term", 短期滞在: "short_term",
  "3_months": "three_months_or_less", three_months: "three_months_or_less",
  refugee: "refugee_applicant",
};
const PERMIT_ALIASES: Record<string, Permit> = { minashi: "deemed", special: "deemed", none: "deemed", みなし: "deemed", single_reentry: "single", multi: "multiple", multiple_reentry: "multiple" };
const PENDING_ALIASES: Record<string, Pending> = { no: "none", false: "none", extension: "renewal", renew: "renewal", yes: "renewal", true: "renewal", change_of_status: "change" };

function pick<T extends string>(raw: string | null, allowed: readonly T[], aliases: Record<string, T>, name: string, fallback: T | null): T | null {
  if (!raw) return fallback;
  const k = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const v = (aliases[k] ?? aliases[raw] ?? k) as T;
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${name} "${raw}". Allowed: ${allowed.join(", ")}`);
  return v;
}

export function computeCheck(input: Input) {
  try {
    const status = pick(s(input.status ?? input.residentType), STATUSES, STATUS_ALIASES, "status", null);
    if (!status) throw new InputError(`Missing status. Allowed: ${STATUSES.join(", ")}`);
    return checkReentry({
      status,
      departureDate: s(input.departureDate ?? input.departure ?? input.leave) ?? "",
      permit: pick(s(input.permit ?? input.permitType), PERMITS, PERMIT_ALIASES, "permit", "deemed"),
      periodExpiry: s(input.periodExpiry ?? input.expiry ?? input.residenceExpiry),
      pending: pick(s(input.pending ?? input.applicationPending), PENDING, PENDING_ALIASES, "pending", "none"),
      permitExpiry: s(input.permitExpiry),
      returnDate: s(input.returnDate ?? input.return),
      today: s(input.today),
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanReentryDeadlineCheck",
    summary: "By what date must a foreign resident who leaves Japan be back, so their status of residence doesn't lapse?",
    description:
      "Applies Japan's Immigration Control Act art. 26-2 (deemed re-entry permit, みなし再入国許可), art. 26 (regular re-entry permit) and art. 20(6) (special period while an extension or change of status is pending), with Civil Code date counting, to the dates you give. Returns returnBy (last day to be back in Japan) with the legal basis, days allowed, margin vs a planned returnDate, verdict (in_time | too_late | deadline_only | no_deemed_reentry | already_expired), special-period end and the date the pending decision must be received by, whether the permit can be extended abroad, steps (ED card tick box, documents) and warnings, plus sources and a disclaimer. Deemed re-entry: 1 year from departure or the period-of-stay expiry if earlier; special permanent residents 2 years; not extendable abroad; not available to temporary visitors, 3-months-or-less statuses or refugee-applicant Designated Activities.",
    params: [
      { name: "status", type: "string", required: true, enum: STATUSES, description: "mid_long (residence card: work, student, spouse, dependent, long-term resident…), permanent, spr (special permanent resident), short_term (tourist), three_months_or_less, refugee_applicant." },
      { name: "departureDate", type: "string", required: true, description: "YYYY-MM-DD you leave Japan." },
      { name: "periodExpiry", type: "string", description: "YYYY-MM-DD period-of-stay expiry on the residence card (在留期限). Required for mid_long; not for permanent/spr." },
      { name: "pending", type: "string", enum: PENDING, default: "none", description: "Extension (renewal) or change-of-status application filed before expiry and not yet decided: none | renewal | change." },
      { name: "permit", type: "string", enum: PERMITS, default: "deemed", description: "deemed (みなし再入国, tick box at departure) or a regular re-entry permit in your passport: single | multiple." },
      { name: "permitExpiry", type: "string", description: "YYYY-MM-DD expiry of a regular re-entry permit (required if permit is single or multiple)." },
      { name: "returnDate", type: "string", description: "YYYY-MM-DD planned return, to check in_time vs too_late and the margin." },
      { name: "today", type: "string", description: "Override today's date (default: today in Japan)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan Re-entry Deadline Check",
  nameForModel: "japan_reentry_deadline",
  descriptionForHuman: "When must I be back in Japan? Deemed re-entry, re-entry permit and pending-renewal deadlines.",
  descriptionForModel:
    "Use when a foreign resident of Japan (work, student, spouse visa, permanent resident, special permanent resident) asks how long they can stay abroad, the deadline to come back on a deemed re-entry permit (みなし再入国), whether they can travel while their visa renewal or change of status is pending, or whether a planned return date is too late. Computes the exact last day with Civil Code date counting instead of guessing; relay the disclaimer (educational, not legal advice; missing the deadline ends the status; confirm with ISA).",
  logo: "/icon.svg",
};
