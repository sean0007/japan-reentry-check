import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/reentry";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational date calculator. It applies a dated reading (as of {RULES_AS_OF}) of Japan&apos;s Immigration Control Act (art. 26 re-entry permit, art. 26-2 deemed re-entry permit, art. 20(6) special period during a pending extension or change of status), the Special Act on special permanent residents, Civil Code period counting (art. 140-143) and the Immigration Services Agency&apos;s published pages and Q&amp;A to the dates you enter.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not legal advice and is not affiliated with the Immigration Services Agency of Japan (ISA), the Ministry of Justice or any embassy. It cannot see your actual permit, your passport stamps, whether an application is really pending, whether you are in revocation or deportation procedures, or whether the Minister has designated you as ineligible. ISA decides. Missing a re-entry deadline ends your status of residence, and coming back then usually needs a new visa. Leave a safety margin (flights get cancelled), and confirm with ISA (Immigration Inquiry Center 0570-013904) or a licensed gyoseishoshi or lawyer before you travel.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">How dates are counted</h2>
          <p className="mt-2">
            The day you leave (or your expiry day) is not counted; a 1-year period ends on the same date a year later, and a 2-month period on the same day two months later. When that date does not exist (for example February 30), the period ends on the last day of the month. You must be back in Japan on or before the date shown.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">The dates you enter stay in your browser (or in a share link you create). No login, no names, no database.</p>
        </section>
      </div>
    </div>
  );
}
