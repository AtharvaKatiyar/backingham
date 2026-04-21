import test from "node:test";
import assert from "node:assert/strict";

import inquirer from "inquirer";
import { getPostgresConfig } from "../../src/prompts/postgres.js";

function withMockedPrompt(responses, fn) {
  const original = inquirer.prompt;
  let index = 0;

  inquirer.prompt = async () => responses[index++];

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      inquirer.prompt = original;
    });
}

test("Postgres prompt - Docker flow", async () => {
  await withMockedPrompt(
    [
      { connectionType: "Docker" },
      {
        container: "pg-container",
        user: "postgres",
        password: "pw",
        database: "app",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getPostgresConfig();

      assert.equal(config.db, "postgres");
      assert.equal(config.mode, "docker");
      assert.equal(config.container, "pg-container");
      assert.equal(config.user, "postgres");
    }
  );
});

test("Postgres prompt - Local flow", async () => {
  await withMockedPrompt(
    [
      { connectionType: "Local" },
      {
        host: "127.0.0.1",
        port: "5432",
        user: "postgres",
        password: "pw",
        database: "app",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getPostgresConfig();

      assert.equal(config.db, "postgres");
      assert.equal(config.mode, "local");
      assert.equal(config.host, "127.0.0.1");
      assert.equal(config.port, "5432");
    }
  );
});

test("Postgres prompt - Remote flow", async () => {
  await withMockedPrompt(
    [
      { connectionType: "Remote" },
      { method: "Manual details" },
      {
        host: "10.0.0.25",
        port: "5433",
        user: "postgres",
        password: "pw",
        database: "app",
        sslmode: "require",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getPostgresConfig();

      assert.equal(config.db, "postgres");
      assert.equal(config.mode, "remote");
      assert.equal(config.host, "10.0.0.25");
      assert.equal(config.port, "5433");
    }
  );
});
