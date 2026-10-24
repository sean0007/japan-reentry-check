import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → return by 2027-03-15, in time`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-24`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.returnBy, "2027-03-15");
  assert.equal(body.verdict, "in_time");
  assert.ok(body.sources.length);
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-24`);
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(url.searchParams)) }));
  const get = await handler(new Request(url));
  assert.equal(post.status, 200);
  assert.deepEqual(await post.json(), await get.json());
});

test("aliases", async () => {
  const b = await (await handler(new Request(`${PUBLIC_URL}${e.path}?status=pr&departure=2026-12-25&today=2026-10-24`))).json();
  assert.equal(b.status, "permanent");
  assert.equal(b.returnBy, "2027-12-25");
  const t = await (await handler(new Request(`${PUBLIC_URL}${e.path}?status=${encodeURIComponent("短期滞在")}&departureDate=2026-12-25`))).json();
  assert.equal(t.verdict, "no_deemed_reentry");
  const x = await (await handler(new Request(`${PUBLIC_URL}${e.path}?status=student&departureDate=2026-12-25&expiry=2027-02-01&pending=yes&today=2026-10-24`))).json();
  assert.equal(x.returnBy, "2027-04-01");
});

test("bad inputs → 400 with example", async () => {
  for (const q of ["departureDate=2026-12-25", "status=alien&departureDate=2026-12-25", "status=mid_long&departureDate=2026-12-25", "status=permanent&departureDate=2026-13-01", "status=permanent&departureDate=2026-12-25&permit=rocket", "status=mid_long&departureDate=2026-12-25&periodExpiry=2028-01-01&permit=single"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
    const body = await res.json();
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.ok(body.example);
  }
});

test("malformed JSON body → 400", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{nope" }));
  assert.equal(res.status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI lists /api/check GET and POST", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; paths: Record<string, { get: { parameters: { name: string }[] }; post: unknown }> };
  assert.ok(spec.openapi.startsWith("3."));
  assert.ok(spec.paths["/api/check"]?.post);
  assert.ok(spec.paths["/api/check"].get.parameters.find((p) => p.name === "departureDate"));
});
