import assert from "node:assert/strict";
import test from "node:test";
import { EXAMPLE_PR, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, safeCheck, sharedQuery } from "./share";

test("share link round-trips", () => {
  for (const ex of [EXAMPLE_SHARED, EXAMPLE_PR]) {
    const back = parseShared(new URLSearchParams(sharedQuery(ex)));
    assert.deepEqual(back, ex);
    assert.ok(isIndexable(ex));
    assert.ok(safeCheck(ex));
  }
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?s=mid_long&d=2026-12-20&e=2027-01-15&p=renewal&r=2027-02-10");
});

test("bad share params → null", () => {
  assert.equal(parseShared(new URLSearchParams("s=alien&d=2026-12-20")), null);
  assert.equal(parseShared(new URLSearchParams("s=permanent&d=nope")), null);
});
