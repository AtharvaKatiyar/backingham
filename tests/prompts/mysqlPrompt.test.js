import test from "node:test";
import assert from "node:assert/strict";

import inquirer from "inquirer";
import { getMySQLConfig } from "../../src/prompts/mysql.js";

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

test("MySQL prompt - Local flow", async () => {
  await withMockedPrompt(
    [
      { connectionType: "Local" },
      {
        host: "127.0.0.1",
        port: "3306",
        user: "root",
        password: "root",
        database: "shop",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getMySQLConfig();

      assert.equal(config.db, "mysql");
      assert.equal(config.connectionType, "Local");
      assert.equal(config.host, "127.0.0.1");
      assert.equal(config.port, "3306");
    }
  );
});

test("MySQL prompt - Remote flow", async () => {
  await withMockedPrompt(
    [
      { connectionType: "Remote" },
      {
        host: "10.10.1.20",
        port: "3307",
        user: "admin",
        password: "pw",
        database: "shop",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getMySQLConfig();

      assert.equal(config.db, "mysql");
      assert.equal(config.connectionType, "Remote");
      assert.equal(config.host, "10.10.1.20");
      assert.equal(config.port, "3307");
    }
  );
});
