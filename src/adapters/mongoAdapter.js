//mongoAdapter.js
import { BaseAdapter } from "./baseAdapter.js";
import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export class MongoAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
  }

    buildUri() {
      const { uri, host, port, user, password, database } = this.config;

      if (uri && uri.trim() !== "") {
        return uri;
      }
      if (user && password) {
        return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`;
      }
      return `mongodb://${host}:${port}/${database}`;
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
        else reject(new Error("MongoDB connection failed"));
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
        throw new Error("Output directory is missing in config");
    }

    const outputPath = path.join(
        output,
        `${database}-${Date.now()}`
    );

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    const args = [
      "--uri",
      uri,
      "--drop",
      dbBackupPath,
    ];

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
        reject(new Error(`Failed to start mongodump: ${err.message}`));
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
                reject(new Error("Compression failed: " + err.message));
                }
            } else {
                reject(new Error("MongoDB backup failed"));
            }
            });
    });
    }

  async restore(backupPath) {
    const { database } = this.config;

    const uri = this.buildUri();

    const dbBackupPath = path.join(backupPath, database);

    const args = [
      "--uri",
      uri,
      "--db",
      database,
      dbBackupPath,
    ];

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
        else reject(new Error("MongoDB restore failed"));
      });
    });
  }
}