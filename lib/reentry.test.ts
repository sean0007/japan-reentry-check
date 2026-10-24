import assert from "node:assert/strict";
import test from "node:test";
import { checkReentry, periodEnd, RuleInputError } from "./reentry";

const T = "2026-10-24";

test("Civil Code period end: 1 year and 2 months, month-end clamps", () => {
  assert.equal(periodEnd("2026-10-24", 12), "2027-10-24");
  assert.equal(periodEnd("2026-10-31", 2), "2026-12-31");
  assert.equal(periodEnd("2026-11-30", 2), "2027-01-31");
  assert.equal(periodEnd("2026-12-15", 2), "2027-02-15");
  assert.equal(periodEnd("2026-12-30", 2), "2027-02-28");
  assert.equal(periodEnd("2027-12-30", 2), "2028-02-29");
  assert.equal(periodEnd("2028-02-28", 12), "2029-02-28");
  assert.equal(periodEnd("2028-02-29", 12), "2029-02-28");
  assert.equal(periodEnd("2026-10-24", 24), "2028-10-24");
});

test("mid_long: 1 year when the period of stay lasts longer", () => {
  const r = checkReentry({ status: "mid_long", departureDate: "2026-11-01", periodExpiry: "2029-04-01", today: T });
  assert.equal(r.returnBy, "2027-11-01");
  assert.equal(r.verdict, "deadline_only");
  assert.equal(r.canExtendAbroad, false);
  assert.equal(r.daysAllowedFromDeparture, 365);
});

test("mid_long: expiry first caps the deadline", () => {
  const r = checkReentry({ status: "mid_long", departureDate: "2026-11-01", periodExpiry: "2027-03-31", returnDate: "2027-04-02", today: T });
  assert.equal(r.returnBy, "2027-03-31");
  assert.equal(r.verdict, "too_late");
  assert.equal(r.marginDays, -2);
});

test("pending renewal: earlier of 1 year or expiry + 2 months; decision by special-period end", () => {
  const r = checkReentry({ status: "mid_long", departureDate: "2026-12-20", periodExpiry: "2027-01-15", pending: "renewal", returnDate: "2027-02-10", today: T });
  assert.equal(r.returnBy, "2027-03-15");
  assert.equal(r.specialPeriod?.endsOn, "2027-03-15");
  assert.equal(r.verdict, "in_time");
  assert.equal(r.marginDays, 33);
  const late = checkReentry({ status: "mid_long", departureDate: "2026-12-20", periodExpiry: "2026-12-30", pending: "change", returnDate: "2027-03-01", today: T });
  assert.equal(late.returnBy, "2027-02-28");
  assert.equal(late.verdict, "too_late");
});

test("permanent 1 year, SPR 2 years, no expiry needed", () => {
  assert.equal(checkReentry({ status: "permanent", departureDate: "2026-12-25", today: T }).returnBy, "2027-12-25");
  assert.equal(checkReentry({ status: "spr", departureDate: "2026-12-25", today: T }).returnBy, "2028-12-25");
  assert.equal(checkReentry({ status: "permanent", departureDate: "2026-12-25", returnDate: "2028-01-05", today: T }).verdict, "too_late");
});

test("no deemed re-entry for short-term, 3-month and refugee-applicant statuses", () => {
  for (const status of ["short_term", "three_months_or_less", "refugee_applicant"] as const) {
    const r = checkReentry({ status, departureDate: "2026-11-01", periodExpiry: "2027-01-10", today: T });
    assert.equal(r.verdict, "no_deemed_reentry", status);
    assert.equal(r.returnBy, null);
  }
  assert.equal(checkReentry({ status: "three_months_or_less", departureDate: "2026-11-01", periodExpiry: "2027-01-10", today: T }).needsRegularPermit, true);
});

test("regular permit: deadline is the permit date, extendable abroad, pending caps it", () => {
  const r = checkReentry({ status: "mid_long", departureDate: "2026-11-01", periodExpiry: "2029-04-01", permit: "multiple", permitExpiry: "2029-04-01", returnDate: "2028-06-01", today: T });
  assert.equal(r.returnBy, "2029-04-01");
  assert.equal(r.verdict, "in_time");
  assert.equal(r.canExtendAbroad, true);
  const p = checkReentry({ status: "mid_long", departureDate: "2026-11-01", periodExpiry: "2027-01-31", pending: "renewal", permit: "single", permitExpiry: "2027-06-30", today: T });
  assert.equal(p.returnBy, "2027-03-31");
  assert.throws(() => checkReentry({ status: "mid_long", departureDate: "2026-11-01", periodExpiry: "2027-01-31", permit: "single", today: T }), RuleInputError);
});

test("leaving after expiry without a pending application → already_expired", () => {
  const r = checkReentry({ status: "mid_long", departureDate: "2027-02-01", periodExpiry: "2027-01-31", today: T });
  assert.equal(r.verdict, "already_expired");
});

test("input errors", () => {
  assert.throws(() => checkReentry({ status: "mid_long", departureDate: "2026-11-01", today: T }), RuleInputError);
  assert.throws(() => checkReentry({ status: "permanent", departureDate: "2026-02-30", today: T }), RuleInputError);
  assert.throws(() => checkReentry({ status: "permanent", departureDate: "2026-11-01", returnDate: "2026-10-01", today: T }), RuleInputError);
});
