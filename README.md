# Japan Re-entry Deadline Check

Free checker for the last day a foreign resident who leaves Japan must be back: deemed re-entry permit (みなし再入国, 1 year or residence-card expiry if sooner; special permanent residents 2 years), regular re-entry permits, and the 2-month special period while an extension or change of status is pending.

Live: https://japan-reentry-check.vercel.app

- Keyless JSON API: `GET /api/check?status=mid_long&departureDate=2026-12-20&periodExpiry=2027-01-15&pending=renewal`
- Rules: `/api/rules` · OpenAPI: `/openapi.json` · `/llms.txt` · `/.well-known/ai-plugin.json`
- MCP: `japan_reentry_deadline_check` on https://free-agent-tools.vercel.app/mcp

Sources: Immigration Control Act art. 20(6), 26, 26-2 (e-Gov) and the Immigration Services Agency's pages and Q&A. Rules as of 2026-10-24.

**Disclaimer:** educational, not legal advice, not affiliated with the Immigration Services Agency of Japan. Missing the deadline ends your status; confirm with ISA before you travel.

`npm ci && npm test && npm run build`
