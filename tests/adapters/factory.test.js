import test from "node:test";
import assert from "node:assert/strict";

import { getAdapter } from "../../src/adapters/adaptorFactory.js";
import { MongoAdapter } from "../../src/adapters/mongoAdapter.js";
import { MySQLAdapter } from "../../src/adapters/mysqlAdaptor.js";
import { PostgresAdapter } from "../../src/adapters/postgresAdapter.js";

test("returns Mongo adapter", () => {
  const adapter = getAdapter({ db: "mongodb" });
  assert.ok(adapter instanceof MongoAdapter);
});

test("returns MySQL adapter", () => {
  const adapter = getAdapter({ db: "mysql" });
  assert.ok(adapter instanceof MySQLAdapter);
});

test("returns Postgres adapter", () => {
  const adapter = getAdapter({ db: "postgres" });
  assert.ok(adapter instanceof PostgresAdapter);
});

test("throws for unsupported db", () => {
  assert.throws(() => getAdapter({ db: "sqlite" }), /Unsupported database type/i);
});

test("throws when db is missing", () => {
  assert.throws(() => getAdapter({}), /Database type is required/i);
});
