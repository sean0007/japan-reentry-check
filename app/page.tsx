import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { SOURCES } from "@/lib/reentry";
import { EXAMPLE_PR, EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "Japan re-entry deadline: when must I be back? (みなし再入国 checker)";
const description =
  "Free checker for foreign residents leaving Japan: the exact date you must return on a deemed re-entry permit (1 year, or your residence card expiry if sooner; special permanent residents 2 years), a regular re-entry permit, or while your visa renewal or change of status is pending (2-month special period). Free JSON API for AI agents. Educational, not legal advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan Re-entry Deadline Check",
  alternateName: ["みなし再入国 期限 計算", "再入国許可 期限 チェック", "Japan special re-entry permit deadline calculator"],
  url: PUBLIC_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description: "Unofficial, free calculator for the last day a foreign resident must re-enter Japan under a deemed or regular re-entry permit, including the special period while a renewal is pending, with a keyless JSON API. Not affiliated with the Immigration Services Agency of Japan.",
};

const faq: FaqItem[] = [
  {
    q: "How long can I leave Japan without a re-entry permit?",
    a: "With a valid passport and residence card you can leave on a deemed re-entry permit (みなし再入国許可) by ticking the box on the re-entry ED card. You must come back within 1 year of the day you leave, or by the expiry date of your period of stay if that comes first. Special permanent residents get 2 years. Example: leave on 2026-12-20 with a residence card expiring 2027-06-30 → back by 2027-06-30, not 2027-12-20.",
  },
  {
    q: "Can I extend a deemed re-entry permit from abroad?",
    a: "No. A deemed re-entry permit cannot be extended outside Japan (Immigration Control Act art. 26-2(3)). If you don't return in time, your status of residence ends. If you might be away longer than a year, apply for a regular re-entry permit (up to 5 years within your period of stay) at your immigration office before leaving; that one can be extended at a Japanese embassy by up to 1 year.",
  },
  {
    q: "Can I travel abroad while my visa renewal is being processed?",
    a: "Yes, if you leave on a deemed or regular re-entry permit. If you applied before your expiry date and no decision has been made yet, you may stay in Japan until the decision or 2 months after your old expiry date (the special period, art. 20(6)). With deemed re-entry you must return by the earlier of 1 year from departure or the end of that 2-month period, and you must receive the decision at the immigration office before the 2 months end (ISA Q&A).",
  },
  {
    q: "My residence card expires on January 15 and my renewal is pending. What is my deadline?",
    a: "The special period ends at the end of March 15 (2 months after the expiry date, counted under the Civil Code). Leave on December 20 → be back by March 15 and collect the new card by then. If the expiry is December 30, the 2 months end on February 28 (there is no February 30).",
  },
  {
    q: "How long can a permanent resident stay outside Japan?",
    a: "On a deemed re-entry permit: 1 year from departure. With a regular re-entry permit: up to its validity (max 5 years), extendable at an embassy by up to 1 year (max 6 years from when it took effect). Miss the date and permanent residence is lost. Long absences can also hurt other applications.",
  },
  {
    q: "Can tourists get a re-entry permit?",
    a: "No. Temporary visitors (短期滞在) and people with a period of stay of 3 months or less have no deemed re-entry, and ISA does not in principle grant re-entry permits to temporary visitors. Leaving ends the stay. The only exception is a short-term visitor on a designated cruise ship (15 days, art. 26-3).",
  },
  {
    q: "How much does a regular re-entry permit cost?",
    a: "At the immigration counter ¥4,000 for single use or ¥7,000 for multiple use (revenue stamps), cheaper online (¥3,500 / ¥6,500). A deemed re-entry permit is free and needs no application, just the ED card tick box.",
  },
  {
    q: "How is the date counted?",
    a: "Japan counts periods under the Civil Code (art. 140-143): the day you leave is not counted, and the period ends on the same date one year later. Leave 2026-10-24 → back by 2027-10-24. If that date doesn't exist (e.g. February 29), the period ends on the last day of the month.",
  },
  {
    q: "Is there a free API for AI agents?",
    a: `Yes. GET or POST ${PUBLIC_URL}/api/check?status=mid_long&departureDate=2026-12-20&periodExpiry=2027-01-15&pending=renewal (keyless, CORS open), rules at /api/rules, OpenAPI at /openapi.json, llms.txt, and the MCP tool japan_reentry_deadline_check on free-agent-tools.vercel.app/mcp. Every response carries rulesAsOf, sources and a disclaimer.`,
  },
  {
    q: "みなし再入国許可で出国した場合、いつまでに戻ればいいですか？",
    a: "出国の日から1年以内です。ただし在留期限が1年より前に来る場合は在留期限までです（特別永住者は2年）。みなし再入国許可は海外で延長できません。期限までに戻らないと在留資格がなくなります。",
  },
  {
    q: "在留期間更新申請中に海外へ行けますか？",
    a: "みなし再入国許可または再入国許可で出国できます。審査中で在留期限を過ぎた場合（特例期間）、出国の日から1年と「在留期限から2か月」のいずれか早い日までに再入国し、特例期間内に結果を受け取る必要があります。",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · みなし再入国 · 再入国許可</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">When do I have to be back in Japan?</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
          Going home for New Year or a long trip on a work, student, spouse or permanent resident visa? Your deemed re-entry permit lasts 1 year from the day you leave, but only until your residence card expires if that comes first, and it cannot be extended from abroad. If your renewal is still pending, you have until 2 months after your old expiry date, and you must pick up the decision in Japan by then. Enter your dates to get the exact last day.
        </p>
        <p className="mt-3 text-sm text-muted">
          Examples:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            renewal pending, trip over New Year
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_PR)}>
            permanent resident away 1 year+
          </a>
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-5xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">The rules in one table</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Situation</th>
                <th className="px-4 py-3 font-medium">Be back by</th>
                <th className="px-4 py-3 font-medium">Extend abroad?</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Deemed re-entry (residence card holders, PR)</td><td className="px-4 py-3">1 year from departure, or card expiry if sooner</td><td className="px-4 py-3">No</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Deemed re-entry, special permanent resident</td><td className="px-4 py-3">2 years from departure</td><td className="px-4 py-3">No</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Renewal / change pending past expiry (deemed)</td><td className="px-4 py-3">Earlier of 1 year from departure or expiry + 2 months; get the decision by then</td><td className="px-4 py-3">No</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Regular re-entry permit (¥4,000 / ¥7,000)</td><td className="px-4 py-3">Permit expiry (max 5 years, within period of stay)</td><td className="px-4 py-3">Yes, up to 1 year at an embassy</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Temporary visitor / period of 3 months or less</td><td className="px-4 py-3">No re-entry: leaving ends the stay (3-month statuses can get a regular permit)</td><td className="px-4 py-3">—</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          Official pages:{" "}
          {SOURCES.slice(0, 4).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace("https://www.", "").slice(0, 60)}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2 break-all" href="/api/check?status=mid_long&departureDate=2026-12-20&periodExpiry=2027-01-15&pending=renewal">
            /api/check?status=mid_long&amp;departureDate=2026-12-20&amp;periodExpiry=2027-01-15&amp;pending=renewal
          </a>
          . Rules: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_reentry_deadline_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Re-entry questions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
