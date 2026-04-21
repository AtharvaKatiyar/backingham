import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeFileComponent } from "../../src/utils/sanitize.js";

test("sanitizeFileComponent keeps safe characters", () => {
  assert.equal(sanitizeFileComponent("my-db_01.backup"), "my-db_01.backup");
});

test("sanitizeFileComponent replaces unsafe characters", () => {
  assert.equal(sanitizeFileComponent("../../prod db*?"), "prod_db");
});

test("sanitizeFileComponent uses fallback for empty values", () => {
  assert.equal(sanitizeFileComponent("   ", "mongo"), "mongo");
});
