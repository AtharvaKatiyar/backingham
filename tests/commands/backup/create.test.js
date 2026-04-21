import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

import inquirer from "inquirer";
import createBackup from "../../../src/commands/backup/create.js";
import { PostgresAdapter } from "../../../src/adapters/postgresAdapter.js";

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

function createTempContext() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "backinghum-create-test-"));
  const backupFile = path.join(dir, "backup.sql");
  const registryPath = path.join(dir, "backupRegistry.json");

  fs.writeFileSync(backupFile, "-- test backup\n");

  return { dir, backupFile, registryPath };
}

test("createBackup infers database from postgres URI", async () => {
  const { dir, backupFile, registryPath } = createTempContext();

  const originalRegistryPath = process.env.DB_BACKUP_REGISTRY_PATH;
  process.env.DB_BACKUP_REGISTRY_PATH = registryPath;

  const originalTestConnection = PostgresAdapter.prototype.testConnection;
  const originalBackup = PostgresAdapter.prototype.backup;

  PostgresAdapter.prototype.testConnection = async function mockedTestConnection() {
    return true;
  };

  PostgresAdapter.prototype.backup = async function mockedBackup() {
    return backupFile;
  };

  try {
    await withMockedPrompt(
      [
        { connectionType: "Remote" },
        { method: "Connection URI" },
        {
          uri: "postgres://user:pass@db.example.com:5432/app_main?sslmode=require",
          output: dir,
        },
      ],
      async () => {
        await createBackup({ db: "postgres" });
      }
    );

    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

    assert.equal(registry.length, 1);
    assert.equal(registry[0].db, "postgres");
    assert.equal(registry[0].database, "app_main");
  } finally {
    PostgresAdapter.prototype.testConnection = originalTestConnection;
    PostgresAdapter.prototype.backup = originalBackup;

    if (originalRegistryPath === undefined) {
      delete process.env.DB_BACKUP_REGISTRY_PATH;
    } else {
      process.env.DB_BACKUP_REGISTRY_PATH = originalRegistryPath;
    }

    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("createBackup decodes URI database and falls back when URI is invalid", async () => {
  const { dir, backupFile, registryPath } = createTempContext();

  const originalRegistryPath = process.env.DB_BACKUP_REGISTRY_PATH;
  process.env.DB_BACKUP_REGISTRY_PATH = registryPath;

  const originalTestConnection = PostgresAdapter.prototype.testConnection;
  const originalBackup = PostgresAdapter.prototype.backup;

  PostgresAdapter.prototype.testConnection = async function mockedTestConnection() {
    return true;
  };

  PostgresAdapter.prototype.backup = async function mockedBackup() {
    return backupFile;
  };

  try {
    await withMockedPrompt(
      [
        { connectionType: "Remote" },
        { method: "Connection URI" },
        {
          uri: "postgres://user:pass@db.example.com:5432/my%20db?sslmode=require",
          output: dir,
        },
      ],
      async () => {
        await createBackup({ db: "postgres" });
      }
    );

    await withMockedPrompt(
      [
        { connectionType: "Remote" },
        { method: "Connection URI" },
        {
          uri: "not a valid uri",
          output: dir,
        },
      ],
      async () => {
        await createBackup({ db: "postgres" });
      }
    );

    const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

    assert.equal(registry.length, 2);
    assert.equal(registry[0].database, "my db");
    assert.equal(registry[1].database, "postgres");
  } finally {
    PostgresAdapter.prototype.testConnection = originalTestConnection;
    PostgresAdapter.prototype.backup = originalBackup;

    if (originalRegistryPath === undefined) {
      delete process.env.DB_BACKUP_REGISTRY_PATH;
    } else {
      process.env.DB_BACKUP_REGISTRY_PATH = originalRegistryPath;
    }

    fs.rmSync(dir, { recursive: true, force: true });
  }
});
