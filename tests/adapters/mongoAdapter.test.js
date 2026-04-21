import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMongoUri,
  buildMongoDumpArgs,
  buildMongoRestoreArgs,
} from "../../src/adapters/mongoAdapter.js";

test("buildMongoUri prefers provided uri", () => {
  const uri = buildMongoUri({
    uri: "mongodb+srv://user:pass@cluster.mongodb.net/mydb",
    host: "127.0.0.1",
    port: 27017,
    database: "ignored",
  });

  assert.equal(uri, "mongodb+srv://user:pass@cluster.mongodb.net/mydb");
});

test("buildMongoUri builds local auth uri", () => {
  const uri = buildMongoUri({
    host: "127.0.0.1",
    port: 27017,
    user: "root",
    password: "root",
    database: "air",
  });

  assert.equal(uri, "mongodb://root:root@127.0.0.1:27017/air?authSource=admin");
});

test("buildMongoUri builds local non-auth uri", () => {
  const uri = buildMongoUri({
    host: "127.0.0.1",
    port: 27017,
    database: "air",
  });

  assert.equal(uri, "mongodb://127.0.0.1:27017/air");
});

test("buildMongoDumpArgs uses --out", () => {
  const args = buildMongoDumpArgs("mongodb://127.0.0.1:27017/air", "/tmp/backup");
  assert.deepEqual(args, ["--uri", "mongodb://127.0.0.1:27017/air", "--out", "/tmp/backup"]);
});

test("buildMongoRestoreArgs merge mode", () => {
  const args = buildMongoRestoreArgs("mongodb://127.0.0.1:27017/air", "air", "/tmp/backup/air", "merge");
  assert.deepEqual(args, ["--uri", "mongodb://127.0.0.1:27017/air", "--db", "air", "/tmp/backup/air"]);
});

test("buildMongoRestoreArgs replace mode adds --drop", () => {
  const args = buildMongoRestoreArgs("mongodb://127.0.0.1:27017/air", "air", "/tmp/backup/air", "replace");
  assert.deepEqual(args, ["--uri", "mongodb://127.0.0.1:27017/air", "--db", "air", "--drop", "/tmp/backup/air"]);
});
