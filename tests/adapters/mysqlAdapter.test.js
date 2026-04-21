import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeMySQLHost,
  buildMySQLClientArgs,
  buildMySQLDumpArgs,
} from "../../src/adapters/mysqlAdaptor.js";

test("normalizeMySQLHost converts localhost", () => {
  assert.equal(normalizeMySQLHost("localhost"), "127.0.0.1");
  assert.equal(normalizeMySQLHost("10.1.1.20"), "10.1.1.20");
});

test("buildMySQLClientArgs builds local args", () => {
  const args = buildMySQLClientArgs({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "secret",
    database: "demo",
  });

  assert.deepEqual(args, ["-h", "127.0.0.1", "-P", "3306", "-u", "root", "-psecret", "demo"]);
});

test("buildMySQLDumpArgs builds remote args", () => {
  const args = buildMySQLDumpArgs({
    host: "192.168.1.22",
    port: 3307,
    user: "admin",
    password: "pw",
    database: "prod",
  });

  assert.deepEqual(args, ["-h", "192.168.1.22", "-P", "3307", "-u", "admin", "-ppw", "prod"]);
});
