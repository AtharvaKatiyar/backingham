//mongoAdapter.js
import { BaseAdapter } from "./baseAdapter.js";
import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { BackupError, ConnectionError, RestoreError, ValidationError } from "../utils/errors.js";

export function buildMongoUri(config) {
  const { uri, host, port, user, password, database } = config;

  if (uri && uri.trim() !== "") {
    return uri;
  }

  if (!host || !port || !database) {
    throw new ValidationError("MongoDB config is missing required fields (host/port/database)");
  }

  if (user && password) {
    return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
  }

  return `mongodb://${host}:${port}/${database}`;
}

export function buildMongoDumpArgs(uri, outputPath) {
  return ["--uri", uri, "--out", outputPath];
}

export function buildMongoRestoreArgs(uri, database, dbBackupPath, restoreMode = "merge") {
  const args = ["--uri", uri, "--db", database];

  if (restoreMode === "replace") {
    args.push("--drop");
  }

  args.push(dbBackupPath);

  return args;
}

export class MongoAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
  }

    buildUri() {
      return buildMongoUri(this.config);
    }

  async testConnection() {
    const uri = this.buildUri();

    const proc = spawn("mongosh", [
      uri,
      "--eval",
      "db.runCommand({ ping: 1 })",
    ]);

    return new Promise((resolve, reject) => {
      proc.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new ConnectionError("MongoDB connection test failed"));
      });
    });
  }

  async checkIfEmpty() {
        const uri = this.buildUri();

        const proc = spawn("mongosh", [
            uri,
            "--quiet",
            "--eval",
            `db.getCollectionNames().length`
        ]);

        return new Promise((resolve) => {
            let output = "";

            proc.stdout.on("data", (data) => {
            output += data.toString();
            });

            proc.on("close", () => {
            resolve(parseInt(output.trim(), 10) === 0);
            });
        });
    }

  async backup() {

    const isEmpty = await this.checkIfEmpty();
    if (isEmpty) {
    console.warn("Database is empty. Backup will contain no data.");
    }

    const { database, output, compress, verbose } =  this.config;

    const uri = this.buildUri();

    if (!output) {
      throw new ValidationError("Output directory is missing in config");
    }

    const outputPath = path.join(
        output,
        `${database}-${Date.now()}`
    );

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    const args = buildMongoDumpArgs(uri, outputPath);

    const proc = spawn("mongodump", args);

    return new Promise((resolve, reject) => {
        if (verbose) {
        proc.stdout.on("data", (data) => {
            console.log(`MongoDB: ${data}`);
        });

        proc.stderr.on("data", (data) => {
        console.error(`MongoDB Error: ${data}`);
        });
        }

        proc.on("error", (err) => {
        reject(new BackupError(`Failed to start mongodump: ${err.message}`));
        });

        proc.on("close", (code) => {
            if (code === 0) {
                try {
                if (compress) {
                    const zipPath = `${outputPath}.tar.gz`;

                    execSync(
                        `tar -czf "${zipPath}" -C "${output}" "${path.basename(outputPath)}"`
                    );

                    console.log("✔ Backup compressed:", zipPath);

                    fs.rmSync(outputPath, { recursive: true, force: true });

                    resolve(zipPath);
                    } else {
                    resolve(outputPath);
                }
                } catch (err) {
                reject(new BackupError("Compression failed: " + err.message));
                }
            } else {
                reject(new BackupError("MongoDB backup failed"));
            }
            });
    });
    }

  async restore(backupPath) {
    const { database, restoreMode } = this.config;

    const uri = this.buildUri();

    const dbBackupPath = path.join(backupPath, database);

    const args = buildMongoRestoreArgs(uri, database, dbBackupPath, restoreMode);

    const proc = spawn("mongorestore", args);

    return new Promise((resolve, reject) => {
      proc.stdout.on("data", (data) => {
        console.log(`MongoDB Restore: ${data}`);
      });

      proc.stderr.on("data", (data) => {
        console.error(`MongoDB Error: ${data}`);
      });

      proc.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new RestoreError("MongoDB restore failed"));
      });
    });
  }
}