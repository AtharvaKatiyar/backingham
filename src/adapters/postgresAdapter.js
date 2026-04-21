//postgresAdapter.js
import { BaseAdapter } from "./baseAdapter.js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export class PostgresAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
  }

  async testConnection() {
    const { host, port, user, password, database, mode, container } = this.config;

    // 🐳 Docker mode
    if (mode === "docker") {
      const proc = spawn("docker", [
        "exec",
        "-e", `PGPASSWORD=${password}`,
        container,
        "psql",
        "-U", user,
        "-d", database,
        "-c", "SELECT 1;"
      ]);

      let errorOutput = "";

      proc.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
          if (code === 0) resolve(true);
          else reject(errorOutput || "Docker PostgreSQL connection failed");
        });
      });
    }

    // 🖥️ Local / Remote mode
    const proc = spawn(
      "psql",
      [
        "-h", host,
        "-p", String(port),
        "-U", user,
        "-d", database,
        "-c", "SELECT 1;"
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: password
        }
      }
    );

    let errorOutput = "";

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    return new Promise((resolve, reject) => {
      proc.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(errorOutput || "PostgreSQL connection failed");
      });
    });
  }

    async backupLocal() {
    const { host, port, user, password, database, output, compress, verbose } =
        this.config;

    if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
    }

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .replace("Z", "");

    const filename = `${database}_${timestamp}.sql`;
    const filePath = path.join(output, filename);

    if (verbose) {
        console.log("Starting pg_dump (local)...");
    }

    const dump = spawn(
        "pg_dump",
        [
        "-h", host,
        "-p", String(port),
        "-U", user,
        "-d", database,
        "-F", "p"
        ],
        {
        env: {
            ...process.env,
            PGPASSWORD: password
        }
        }
    );

    const fileStream = fs.createWriteStream(filePath);

    dump.stdout.pipe(fileStream);

    let errorOutput = "";

    dump.stderr.on("data", (data) => {
      const msg = data.toString();
      errorOutput += msg;

      if (verbose) {
        console.error("pg_dump error:", msg);
      }
    });


    return new Promise((resolve, reject) => {
        dump.on("close", (code) => {
        if (code !== 0) {
              return reject(
                errorOutput || `PostgreSQL backup failed (exit code ${code})`
              );
            }
        if (compress) {
            if (verbose) console.log("Compressing backup...");

            const gzip = spawn("gzip", [filePath]);

            gzip.on("close", (gzipCode) => {
            if (gzipCode === 0) {
                resolve(`${filePath}.gz`);
            } else {
                reject("Compression failed");
            }
            });
        } else {
            resolve(filePath);
        }
        });
    });
    }

    async backupDocker() {
    const { user, password, database, output, compress, verbose, container } =
        this.config;

    if (!container) {
        throw new Error("Docker container name is required for docker mode");
    }

    if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
    }

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .replace("Z", "");

    const filename = `${database}_${timestamp}.sql`;
    const filePath = path.join(output, filename);

    if (verbose) {
        console.log("Starting pg_dump (docker)...");
    }

    const dump = spawn("docker", [
        "exec",
        "-e", `PGPASSWORD=${password}`,
        "-i",
        container,
        "pg_dump",
        "-U", user,
        "-d", database
    ]);

    const fileStream = fs.createWriteStream(filePath);

    dump.stdout.pipe(fileStream);

    let errorOutput = "";

    dump.stderr.on("data", (data) => {
      const msg = data.toString();
      errorOutput += msg;

      if (verbose) {
        console.error("pg_dump error:", msg);
      }
    });


    return new Promise((resolve, reject) => {
        dump.on("close", (code) => {
        if (code !== 0) {
          return reject(
            errorOutput || `PostgreSQL backup failed (docker, exit code ${code})`
          );
        } 

        if (compress) {
            if (verbose) console.log("Compressing backup...");

            const gzip = spawn("gzip", [filePath]);

            gzip.on("close", (gzipCode) => {
            if (gzipCode === 0) {
                resolve(`${filePath}.gz`);
            } else {
                reject(`Compression failed (exit code ${gzipCode})`);
            }
            });
        } else {
            resolve(filePath);
        }
        });
    });
    }

    async backup() {
    if (this.config.mode === "docker") {
        return this.backupDocker();
    } else {
        return this.backupLocal();
    }
    }

  async restore(filePath) {
    const { host, port, user, password, database } = this.config;

    let inputStream;

    if (filePath.endsWith(".gz")) {
      const gunzip = spawn("gunzip", ["-c", filePath]);
      inputStream = gunzip.stdout;
    } else {
      inputStream = fs.createReadStream(filePath);
    }

    const restore = spawn(
      "psql",
      [
        "-h", host,
        "-p", String(port),
        "-U", user,
        "-d", database
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: password
        }
      }
    );

    inputStream.pipe(restore.stdin);

    let errorOutput = "";

    restore.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    restore.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(errorOutput || "Restore failed");
    });
  }
}