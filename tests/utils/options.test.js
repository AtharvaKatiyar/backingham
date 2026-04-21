import test from "node:test";
import assert from "node:assert/strict";

import { normalizeOptions } from "../../src/utils/normalize.js";
import { validateOptions } from "../../src/utils/validate.js";

test("normalizeOptions applies defaults", () => {
  const normalized = normalizeOptions({ db: "mongodb" });

  assert.equal(normalized.db, "mongodb");
  assert.equal(normalized.compress, false);
  assert.equal(normalized.verbose, false);
  assert.equal(normalized.mode, "local");
  assert.equal(normalized.container, null);
});

test("validateOptions for mongodb uri mode", () => {
  const missing = validateOptions({
    db: "mongodb",
    uri: "mongodb+srv://cluster",
    database: "air",
    output: "./backups",
  });

  assert.deepEqual(missing, []);
});

test("validateOptions for mongodb local requires auth fields", () => {
  const missing = validateOptions({
    db: "mongodb",
    host: "127.0.0.1",
    port: "27017",
    database: "air",
    output: "./backups",
  });

  assert.deepEqual(missing, ["user", "password"]);
});

test("validateOptions for mysql complete config", () => {
  const missing = validateOptions({
    db: "mysql",
    host: "127.0.0.1",
    port: "3306",
    user: "root",
    password: "root",
    database: "shop",
    output: "./backups",
  });

  assert.deepEqual(missing, []);
});

test("validateOptions for postgres missing fields", () => {
  const missing = validateOptions({
    db: "postgres",
    host: "127.0.0.1",
    port: "5432",
  });

  assert.deepEqual(missing, ["user", "password", "database", "output"]);
});
