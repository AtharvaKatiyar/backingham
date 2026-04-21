import test from "node:test";
import assert from "node:assert/strict";

import inquirer from "inquirer";
import { getMongoConfig } from "../../src/prompts/mongo.js";

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

test("Mongo prompt - Atlas URI flow", async () => {
  await withMockedPrompt(
    [
      { connectionType: "MongoDB Atlas (URI)" },
      {
        uri: "mongodb+srv://user:pass@cluster.mongodb.net",
        database: "air",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getMongoConfig();

      assert.equal(config.db, "mongodb");
      assert.equal(config.uri, "mongodb+srv://user:pass@cluster.mongodb.net");
      assert.equal(config.database, "air");
      assert.equal(config.output, "./backups");
    }
  );
});

test("Mongo prompt - Local flow with auth", async () => {
  await withMockedPrompt(
    [
      { connectionType: "Local" },
      { requiresAuth: true },
      {
        host: "127.0.0.1",
        port: "27017",
        user: "root",
        password: "root",
        database: "air",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getMongoConfig();

      assert.equal(config.db, "mongodb");
      assert.equal(config.host, "127.0.0.1");
      assert.equal(config.port, "27017");
      assert.equal(config.user, "root");
      assert.equal(config.password, "root");
      assert.equal(config.database, "air");
    }
  );
});

test("Mongo prompt - Local flow without auth", async () => {
  await withMockedPrompt(
    [
      { connectionType: "Local" },
      { requiresAuth: false },
      {
        host: "127.0.0.1",
        port: "27017",
        database: "air",
        output: "./backups",
      },
    ],
    async () => {
      const config = await getMongoConfig();

      assert.equal(config.db, "mongodb");
      assert.equal(config.host, "127.0.0.1");
      assert.equal(config.port, "27017");
      assert.equal(config.database, "air");
      assert.equal(config.user, undefined);
      assert.equal(config.password, undefined);
    }
  );
});
