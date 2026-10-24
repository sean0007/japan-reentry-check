// Japan re-entry deadline logic. Pure functions, no I/O.
// Law: 出入国管理及び難民認定法 (Immigration Control Act) art. 26, 26-2, 20(6), 21(4); 入管特例法 art. 23 (SPR).
// Dates are counted per Civil Code art. 140-143: the departure day / expiry day is not counted,
// the period ends on the day before the corresponding day (or the month's last day if none).

export const RULES_AS_OF = "2026-10-24";

export const STATUSES = ["mid_long", "permanent", "spr", "short_term", "three_months_or_less", "refugee_applicant"] as const;
export type Status = (typeof STATUSES)[number];
export const PERMITS = ["deemed", "single", "multiple"] as const;
export type Permit = (typeof PERMITS)[number];
export const PENDING = ["none", "renewal", "change"] as const;
export type Pending = (typeof PENDING)[number];

export const STATUS_LABEL: Record<Status, { en: string; ja: string }> = {
  mid_long: { en: "Mid- to long-term resident with a residence card (work, student, spouse, dependent, long-term resident…)", ja: "中長期在留者（在留カードあり）" },
  permanent: { en: "Permanent resident (永住者)", ja: "永住者" },
  spr: { en: "Special permanent resident (特別永住者)", ja: "特別永住者" },
  short_term: { en: "Temporary visitor / short-term stay (短期滞在, tourists)", ja: "短期滞在" },
  three_months_or_less: { en: "Status with a period of stay of 3 months or less", ja: "在留期間「3月」以下" },
  refugee_applicant: { en: "Designated Activities while a refugee application is pending", ja: "難民認定申請中の「特定活動」" },
};

export const SOURCES = [
  "https://www.moj.go.jp/isa/immigration/procedures/minashisainyukoku_00001.html",
  "https://www.moj.go.jp/isa/immigration/procedures/16-5.html",
  "https://www.moj.go.jp/isa/immigration/faq/kanri_qa.html",
  "https://www.moj.go.jp/isa/applications/procedures/tokureikikan_00001.html",
  "https://laws.e-gov.go.jp/law/326CO0000000319",
] as const;

export const DISCLAIMER =
  "Educational date calculator, not legal advice and not affiliated with the Immigration Services Agency of Japan (ISA). It applies the Immigration Control Act (art. 26, 26-2, 20(6)) and ISA's published Q&A to the dates you enter; it cannot see your actual permit, any pending decision or your passport stamps. Missing the deadline ends your status of residence. Leave a safety margin and confirm with ISA (0570-013904) or a licensed gyoseishoshi / lawyer before you travel.";

export class RuleInputError extends Error {}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export function validDate(s: string): boolean {
  if (!ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
function toDate(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function addDays(s: string, n: number): string {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
}
export function todayJst(now: Date = new Date()): string {
  return fmt(new Date(now.getTime() + 9 * 3_600_000));
}

/**
 * Last day of a period of `months` counted from the day AFTER `from` (Civil Code 140, 143).
 * e.g. from 2026-10-24, 12 months → 2027-10-24; from 2026-12-30, 2 months → 2027-02-28.
 */
export function periodEnd(from: string, months: number): string {
  const start = toDate(addDays(from, 1));
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth() + months;
  const day = start.getUTCDate();
  const ty = y + Math.floor(m / 12);
  const tm = ((m % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  if (day > lastDay) return fmt(new Date(Date.UTC(ty, tm, lastDay)));
  return addDays(fmt(new Date(Date.UTC(ty, tm, day))), -1);
}

export type CheckInput = {
  status: Status;
  departureDate: string;
  permit?: Permit | null;
  periodExpiry?: string | null;
  pending?: Pending | null;
  permitExpiry?: string | null;
  returnDate?: string | null;
  today?: string | null;
};

export type Verdict = "in_time" | "too_late" | "deadline_only" | "no_deemed_reentry" | "already_expired";

export type CheckResult = {
  verdict: Verdict;
  summary: string;
  status: Status;
  statusLabel: string;
  permit: Permit;
  departureDate: string;
  returnBy: string | null;
  returnByBasis: string | null;
  daysAllowedFromDeparture: number | null;
  plannedReturn: string | null;
  marginDays: number | null;
  daysUntilReturnBy: number | null;
  oneYearFromDeparture: string;
  periodExpiry: string | null;
  specialPeriod: { applies: boolean; endsOn: string | null; mustReceiveDecisionBy: string | null; note: string } | null;
  canExtendAbroad: boolean;
  needsRegularPermit: boolean;
  steps: string[];
  warnings: string[];
  rulesAsOf: string;
  today: string;
  sources: readonly string[];
};

function need(v: string | null | undefined, name: string): string {
  if (!v) throw new RuleInputError(`Missing ${name} (YYYY-MM-DD).`);
  if (!validDate(v)) throw new RuleInputError(`${name} must be a date YYYY-MM-DD.`);
  return v;
}
function opt(v: string | null | undefined, name: string): string | null {
  if (!v) return null;
  if (!validDate(v)) throw new RuleInputError(`${name} must be a date YYYY-MM-DD.`);
  return v;
}

export function checkReentry(input: CheckInput): CheckResult {
  const status = input.status;
  if (!(STATUSES as readonly string[]).includes(status)) throw new RuleInputError(`Invalid status. Allowed: ${STATUSES.join(", ")}`);
  const permit: Permit = input.permit ?? "deemed";
  if (!(PERMITS as readonly string[]).includes(permit)) throw new RuleInputError(`Invalid permit. Allowed: ${PERMITS.join(", ")}`);
  const pending: Pending = input.pending ?? "none";
  if (!(PENDING as readonly string[]).includes(pending)) throw new RuleInputError(`Invalid pending. Allowed: ${PENDING.join(", ")}`);
  const departureDate = need(input.departureDate, "departureDate");
  const periodExpiry = opt(input.periodExpiry, "periodExpiry");
  const permitExpiry = opt(input.permitExpiry, "permitExpiry");
  const plannedReturn = opt(input.returnDate, "returnDate");
  const today = opt(input.today, "today") ?? todayJst();
  if (plannedReturn && plannedReturn < departureDate) throw new RuleInputError("returnDate is before departureDate.");

  const hasPeriod = status === "mid_long" || status === "three_months_or_less" || status === "short_term" || status === "refugee_applicant";
  if (status === "mid_long" && !periodExpiry) throw new RuleInputError("Missing periodExpiry: the period-of-stay expiry date on your residence card (在留期限). Not needed for permanent or special permanent residents.");

  const oneYear = periodEnd(departureDate, 12);
  const steps: string[] = [];
  const warnings: string[] = [];
  let returnBy: string | null = null;
  let basis: string | null = null;
  let specialPeriod: CheckResult["specialPeriod"] = null;
  let canExtendAbroad = false;
  let needsRegularPermit = false;
  let verdict: Verdict = "deadline_only";

  // Special period (art. 20(6)): applied for renewal/change before expiry, no decision yet.
  const spApplies = pending !== "none" && !!periodExpiry && (status === "mid_long" || status === "refugee_applicant");
  const spEnd = spApplies ? periodEnd(periodExpiry!, 2) : null;
  if (spApplies) {
    specialPeriod = {
      applies: true,
      endsOn: spEnd,
      mustReceiveDecisionBy: spEnd,
      note: `You applied for ${pending === "renewal" ? "an extension (在留期間更新)" : "a change of status (在留資格変更)"} before ${periodExpiry}. If no decision is made by then, you may stay on your current status until the decision or until ${spEnd} (2 months after expiry), whichever comes first. You must be back in Japan AND receive the decision at the immigration office by ${spEnd}; after that you are overstaying even though you applied.`,
    };
  }

  if (hasPeriod && periodExpiry && departureDate > periodExpiry && !spApplies) {
    verdict = "already_expired";
    warnings.push(`Your departure date is after your period of stay ends (${periodExpiry}) and you said no renewal/change application is pending. Without a pending application you cannot stay past ${periodExpiry}; talk to ISA now.`);
  } else if (spApplies && departureDate > spEnd!) {
    verdict = "already_expired";
    warnings.push(`Your departure date is after the special period ends (${spEnd}). Talk to ISA now.`);
  } else if (permit === "deemed") {
    if (status === "short_term" || status === "three_months_or_less" || status === "refugee_applicant") {
      verdict = "no_deemed_reentry";
      needsRegularPermit = status !== "short_term";
      if (status === "short_term") {
        steps.push("Temporary visitors (短期滞在) get no deemed re-entry permit and, in principle, no re-entry permit. If you leave, your stay ends; coming back is a new entry (visa-exempt nationals can usually enter again, others need a new visa).");
        steps.push("Exception: on a designated cruise ship (指定旅客船) a short-term visitor can declare re-entry for up to 15 days (art. 26-3). Ask the cruise line.");
      } else {
        steps.push("Deemed re-entry does not cover you. Apply for a regular re-entry permit (再入国許可, single ¥4,000 / multiple ¥7,000 at the counter) at your regional immigration office BEFORE you leave, or your status ends when you depart.");
      }
    } else {
      if (status === "spr") {
        returnBy = periodEnd(departureDate, 24);
        basis = "Special permanent resident: deemed re-entry is valid for 2 years from departure (入管特例法 art. 23).";
      } else if (status === "permanent") {
        returnBy = oneYear;
        basis = "Permanent resident (no period-of-stay limit): deemed re-entry is valid for 1 year from departure (art. 26-2(2)).";
      } else if (spApplies) {
        returnBy = oneYear < spEnd! ? oneYear : spEnd!;
        basis = oneYear < spEnd! ? "1 year from departure (art. 26-2(2)), which comes before the end of your special period." : `Application pending: the earlier of 1 year from departure or 2 months after your old expiry date (${spEnd}) (ISA Q&A Q61).`;
      } else {
        returnBy = periodExpiry! < oneYear ? periodExpiry! : oneYear;
        basis = periodExpiry! < oneYear ? `Your period of stay ends (${periodExpiry}) before 1 year passes, so deemed re-entry only lasts until then (art. 26-2(2)).` : "1 year from departure (art. 26-2(2)); your period of stay lasts longer.";
      }
      canExtendAbroad = false;
      steps.push("Carry a valid passport and your residence card (special permanent residents: SPR certificate).");
      steps.push("At departure, tick the box on the re-entry ED card (再入国用EDカード) saying you are leaving temporarily and will return (一時的な出国であり、再入国する予定です), show it to the officer and say you want deemed re-entry (みなし再入国). If you don't, your status ends when you leave.");
      steps.push(`Be back in Japan by ${returnBy}. A deemed re-entry permit cannot be extended from abroad (art. 26-2(3)); if you might be away longer, get a regular re-entry permit before you leave.`);
    }
  } else {
    // Regular re-entry permit
    if (status === "short_term") {
      verdict = "no_deemed_reentry";
      steps.push("ISA does not, in principle, grant re-entry permits to temporary visitors (Q&A Q62).");
    } else if (!permitExpiry) {
      throw new RuleInputError("Missing permitExpiry: the expiry date of your re-entry permit (再入国許可の有効期限) stamped in your passport.");
    } else {
      returnBy = permitExpiry;
      basis = `Your ${permit === "multiple" ? "multiple" : "single"} re-entry permit expires on ${permitExpiry}.`;
      canExtendAbroad = true;
      const maxYears = status === "spr" ? 6 : 5;
      if (periodExpiry && permitExpiry > periodExpiry && !spApplies) warnings.push(`Your permit date (${permitExpiry}) is after your period of stay ends (${periodExpiry}). A re-entry permit can't run past your period of stay; check the stamp. You must also renew your status before ${periodExpiry} (you cannot renew from abroad).`);
      if (spApplies && permitExpiry > spEnd!) warnings.push(`Even with a later permit date, you must be back and receive your pending decision by ${spEnd}.`);
      if (spApplies && permitExpiry < spEnd!) steps.push(`While your application is pending, ISA can extend your re-entry permit up to the end of the special period (${spEnd}) if you ask before leaving (art. 26(4)).`);
      if (spApplies && spEnd! < permitExpiry) { returnBy = spEnd!; basis = `Application pending: you must be back and receive the decision by ${spEnd} (2 months after your old expiry), before your permit date.`; }
      steps.push(`Be back in Japan by ${returnBy}.`);
      steps.push(`If you truly cannot return in time, a Japanese embassy or consulate abroad can extend a regular permit by up to 1 year and no later than ${maxYears + 1} years after it took effect (art. 26(5)). Your period of stay is NOT extended that way.`);
    }
  }

  if (returnBy && verdict === "deadline_only" && plannedReturn) {
    verdict = plannedReturn <= returnBy ? "in_time" : "too_late";
  }
  const marginDays = returnBy && plannedReturn ? daysBetween(plannedReturn, returnBy) : null;

  if (verdict === "too_late") {
    warnings.push(`Your planned return (${plannedReturn}) is ${-marginDays!} day(s) after the deadline. If you are not back by ${returnBy}, your re-entry permit and your status of residence end. You would need a new visa (usually via a new Certificate of Eligibility) to come back${status === "permanent" ? ", and permanent residence would be lost" : ""}.`);
    if (permit === "deemed" && (status === "mid_long" || status === "permanent")) warnings.push("If the trip can't be shortened, apply for a regular re-entry permit at your immigration office before you leave (valid up to 5 years within your period of stay; extendable abroad).");
  }
  if (verdict === "in_time" && marginDays !== null && marginDays < 7) warnings.push(`Only ${marginDays} day(s) of margin. Flight delays or cancellations do not extend the deadline; consider an earlier flight.`);
  if (spApplies) warnings.push("ISA may contact you about the pending application while you are abroad; keep reachable (Q&A Q61). If your application is refused, you may get only a short stay to prepare to leave.");
  if (status === "permanent") warnings.push("Check your residence card's own validity date (permanent residents renew the card every 7 years; under 16 until the 16th birthday). Renew it before you leave if it would expire while you are away.");
  if (status === "mid_long" && periodExpiry && returnBy && returnBy === periodExpiry && !spApplies) warnings.push(`You come back on or before your expiry (${periodExpiry}) and then still need to renew. You can apply from 3 months before expiry; consider applying before you leave (then the special-period rule applies).`);
  if (status === "mid_long" || status === "permanent") warnings.push("Long absences can count against future renewals, permanent residence or naturalization (e.g. the revised PR guideline looks at long and repeated absences). See japan-pr-check.vercel.app.");

  const daysAllowedFromDeparture = returnBy ? daysBetween(departureDate, returnBy) : null;
  const daysUntilReturnBy = returnBy ? daysBetween(today, returnBy) : null;

  let summary: string;
  if (verdict === "no_deemed_reentry") summary = status === "short_term" ? "Temporary visitors have no re-entry permit: leaving Japan ends your stay." : "Deemed re-entry does not apply to you: get a regular re-entry permit before you leave or your status ends.";
  else if (verdict === "already_expired") summary = "Your dates put you past your permitted stay. Contact ISA before travelling.";
  else if (verdict === "too_late") summary = `Too late: you must be back in Japan by ${returnBy}, but you plan to return on ${plannedReturn}.`;
  else if (verdict === "in_time") summary = `OK: return by ${returnBy}. Your planned return on ${plannedReturn} leaves ${marginDays} day(s) of margin.${spApplies ? ` Then collect your decision by ${spEnd}.` : ""}`;
  else summary = `Be back in Japan by ${returnBy} (${daysAllowedFromDeparture} days after you leave).${spApplies ? ` Then collect your decision by ${spEnd}.` : ""}`;

  return {
    verdict,
    summary,
    status,
    statusLabel: STATUS_LABEL[status].en,
    permit,
    departureDate,
    returnBy,
    returnByBasis: basis,
    daysAllowedFromDeparture,
    plannedReturn,
    marginDays,
    daysUntilReturnBy,
    oneYearFromDeparture: oneYear,
    periodExpiry,
    specialPeriod,
    canExtendAbroad,
    needsRegularPermit,
    steps,
    warnings,
    rulesAsOf: RULES_AS_OF,
    today,
    sources: SOURCES,
  };
}

export const RULES = {
  rulesAsOf: RULES_AS_OF,
  dateCounting: "Civil Code art. 140-143: the departure day (or expiry day) is not counted; the period ends on the day before the corresponding date, or the last day of the month if there is none. 1 year from 2026-10-24 → 2027-10-24; 2 months after an expiry of 2026-12-30 → 2027-02-28.",
  deemedReentry: {
    law: "Immigration Control Act art. 26-2",
    who: "Foreign residents with a valid passport (mid- to long-term residents also need their residence card) who declare at departure that they will return. Not: temporary visitors (短期滞在), people with a period of stay of 3 months or less, Designated Activities while a refugee application is pending, people in revocation or deportation procedures, or people the Minister designates.",
    validity: "1 year from departure, or until the period of stay ends if that comes first. Special permanent residents: 2 years.",
    extendableAbroad: false,
    howTo: "Tick the deemed re-entry box on the re-entry ED card and tell the immigration officer.",
  },
  regularReentry: {
    law: "Immigration Control Act art. 26",
    validity: "Up to 5 years (special permanent residents 6) and never beyond the period of stay.",
    fees: { counterSingleJPY: 4000, counterMultipleJPY: 7000, onlineSingleJPY: 3500, onlineMultipleJPY: 6500, note: "Paid by revenue stamps (収入印紙); online-application fees are lower. Charged only if granted." },
    extendableAbroad: "At a Japanese embassy/consulate, by up to 1 year, and no more than 6 years after it took effect (art. 26(5); special permanent residents 7).",
  },
  specialPeriod: {
    law: "Immigration Control Act art. 20(6) / 21(4)",
    rule: "If you applied for an extension or change of status before your period of stay ends (and your period is over 30 days) and no decision is made by the expiry date, you may stay until the decision or 2 months after the expiry date, whichever is first.",
    leavingWhilePending: "Allowed with a re-entry permit or deemed re-entry. With deemed re-entry, return by the earlier of 1 year from departure or 2 months after the old expiry date, and receive the decision at the immigration office before those 2 months end (ISA Q&A Q61).",
  },
  shortTermVisitors: "No deemed re-entry and, in principle, no re-entry permit (ISA Q&A Q62). Cruise exception: 15 days on a designated passenger ship (art. 26-3).",
  sources: SOURCES,
  disclaimer: DISCLAIMER,
};
