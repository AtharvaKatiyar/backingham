import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPostgresLocalConnectionArgs,
  buildPostgresDockerConnectionArgs,
  buildPostgresLocalDumpArgs,
  buildPostgresDockerDumpArgs,
  buildPostgresRestoreArgs,
} from "../../src/adapters/postgresAdapter.js";

test("buildPostgresLocalConnectionArgs", () => {
  const args = buildPostgresLocalConnectionArgs({
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    database: "app",
  });

  assert.deepEqual(args, ["-h", "127.0.0.1", "-p", "5432", "-U", "postgres", "-d", "app", "-c", "SELECT 1;"]);
});

test("buildPostgresDockerConnectionArgs", () => {
  const args = buildPostgresDockerConnectionArgs({
    password: "pw",
    container: "pg_container",
    user: "postgres",
    database: "app",
  });

  assert.deepEqual(args, ["exec", "-e", "PGPASSWORD=pw", "pg_container", "psql", "-U", "postgres", "-d", "app", "-c", "SELECT 1;"]);
});

test("buildPostgresLocalDumpArgs", () => {
  const args = buildPostgresLocalDumpArgs({
    host: "10.0.0.20",
    port: 5433,
    user: "dbuser",
    database: "app",
  });

  assert.deepEqual(args, ["-h", "10.0.0.20", "-p", "5433", "-U", "dbuser", "-d", "app", "-F", "p"]);
});

test("buildPostgresDockerDumpArgs", () => {
  const args = buildPostgresDockerDumpArgs({
    password: "pw",
    container: "pg_container",
    user: "postgres",
    database: "app",
  });

  assert.deepEqual(args, ["exec", "-e", "PGPASSWORD=pw", "-i", "pg_container", "pg_dump", "-U", "postgres", "-d", "app"]);
});

test("buildPostgresRestoreArgs", () => {
  const args = buildPostgresRestoreArgs({
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    database: "app",
  });

  assert.deepEqual(args, ["-h", "127.0.0.1", "-p", "5432", "-U", "postgres", "-d", "app"]);
});
