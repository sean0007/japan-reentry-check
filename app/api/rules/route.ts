import { preflight, staticJson } from "@/lib/agent-api";
import { PUBLIC_URL } from "@/lib/api";
import { RULES } from "@/lib/reentry";

export function GET() {
  return staticJson({ ...RULES, docs: `${PUBLIC_URL}/openapi.json`, checker: `${PUBLIC_URL}/api/check` });
}
export const OPTIONS = preflight;
