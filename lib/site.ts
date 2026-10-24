export const SITE_NAME = "Japan Re-entry Deadline Check";

export const SITE_TAGLINE =
  "Leaving Japan on a deemed re-entry permit (みなし再入国)? Find the exact date you must be back: 1 year from departure, or your residence card expiry if sooner, or 2 months after expiry if your renewal is still pending. Miss it and your visa status ends.";

export const DISCLAIMER_SHORT = "Educational date calculator, not legal advice, not affiliated with the Immigration Services Agency of Japan. Missing the deadline ends your status; leave a margin and confirm with ISA before you travel.";

export const HONESTY =
  "Rules as of 2026-10-24 from the Immigration Control Act (art. 26, 26-2, 20(6)) and ISA's published pages and Q&A. It only uses the dates you enter; it can't see your actual permit or a pending decision.";

export const SIBLING_TOOLS = [
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://japan-tax-free-refund.vercel.app", label: "Japan Tax-Free Refund" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-intl-postage.vercel.app", label: "Japan International Postage 2027" },
  { href: "https://japan-luggage.vercel.app", label: "Japan Luggage Check" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-reentry-check.vercel.app";
}
