"use client";

import { useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { STATUSES, STATUS_LABEL, type Pending, type Permit, type Status } from "@/lib/reentry";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath, safeCheck, type Shared } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

const VERDICT_STYLE: Record<string, string> = {
  in_time: "text-teal-200",
  deadline_only: "text-teal-200",
  too_late: "text-red-300",
  no_deemed_reentry: "text-red-300",
  already_expired: "text-red-300",
};

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [status, setStatus] = useState<Status>(start.status);
  const [departureDate, setDeparture] = useState(start.departureDate);
  const [periodExpiry, setExpiry] = useState(start.periodExpiry ?? "");
  const [pending, setPending] = useState<Pending>(start.pending);
  const [permit, setPermit] = useState<Permit>(start.permit);
  const [permitExpiry, setPermitExpiry] = useState(start.permitExpiry ?? "");
  const [returnDate, setReturn] = useState(start.returnDate ?? "");

  const hasExpiry = status !== "permanent" && status !== "spr";
  const shared: Shared = {
    status,
    departureDate,
    periodExpiry: hasExpiry && periodExpiry ? periodExpiry : null,
    pending: hasExpiry ? pending : "none",
    permit,
    permitExpiry: permit !== "deemed" && permitExpiry ? permitExpiry : null,
    returnDate: returnDate || null,
  };
  const r = departureDate ? safeCheck(shared) : null;
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your trip</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Your status</span>
          <select data-testid="status" className={field} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s].en}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Date you leave Japan</span>
          <input data-testid="departure" type="date" className={field} value={departureDate} onChange={(e) => setDeparture(e.target.value)} />
        </label>
        {hasExpiry ? (
          <>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-foreground">Period of stay expires (在留期限 on your residence card)</span>
              <input data-testid="expiry" type="date" className={field} value={periodExpiry} onChange={(e) => setExpiry(e.target.value)} />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-foreground">Renewal or change of status applied for, no decision yet?</span>
              <select className={field} value={pending} onChange={(e) => setPending(e.target.value as Pending)}>
                <option value="none">No</option>
                <option value="renewal">Yes: extension / renewal pending (更新申請中)</option>
                <option value="change">Yes: change of status pending (変更申請中)</option>
              </select>
            </label>
          </>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Re-entry permit</span>
          <select className={field} value={permit} onChange={(e) => setPermit(e.target.value as Permit)}>
            <option value="deemed">Deemed re-entry (みなし再入国, tick box at the airport)</option>
            <option value="single">Regular re-entry permit, single (再入国許可)</option>
            <option value="multiple">Regular re-entry permit, multiple (数次)</option>
          </select>
        </label>
        {permit !== "deemed" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-foreground">Re-entry permit valid until (stamp in passport)</span>
            <input type="date" className={field} value={permitExpiry} onChange={(e) => setPermitExpiry(e.target.value)} />
          </label>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Planned return date (optional)</span>
          <input data-testid="return" type="date" className={field} value={returnDate} onChange={(e) => setReturn(e.target.value)} />
        </label>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/60">
        <div className="p-5 sm:p-7" data-testid="result">
          {r ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Be back in Japan by</p>
              <p className={`mt-2 font-display text-5xl tracking-tight sm:text-6xl ${VERDICT_STYLE[r.verdict]}`}>{r.returnBy ?? "—"}</p>
              <p className="mt-3 text-base text-foreground">{r.summary}</p>
              {r.returnByBasis ? <p className="mt-2 text-sm text-muted">{r.returnByBasis}</p> : null}
              {r.specialPeriod ? (
                <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-amber-100">
                  <p className="font-semibold">Special period ends {r.specialPeriod.endsOn}</p>
                  <p className="mt-1 leading-relaxed">{r.specialPeriod.note}</p>
                </div>
              ) : null}
              {r.steps.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">What to do</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {r.warnings.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">Watch out</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.warnings.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="mt-6">
                <ShareBar url={shareUrl} text={r.returnBy ? `I must be back in Japan by ${r.returnBy} (re-entry deadline check)` : "Japan re-entry deadline check"} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Enter your status and dates{hasExpiry ? " (including your residence card expiry)" : ""}{permit !== "deemed" ? " and your permit's expiry" : ""} to see your deadline.</p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}
