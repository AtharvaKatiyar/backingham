//postgresAdapter.js
import { BaseAdapter } from "./baseAdapter.js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { BackupError, ConnectionError, RestoreError, ValidationError } from "../utils/errors.js";
import { sanitizeFileComponent } from "../utils/sanitize.js";

export function buildPostgresLocalConnectionArgs({ host, port, user, database }) {
  return [
    "-h", host,
    "-p", String(port),
    "-U", user,
    "-d", database,
    "-c", "SELECT 1;",
  ];
}

export function buildPostgresDockerConnectionArgs({ password, container, user, database }) {
  return [
    "exec",
    "-e", `PGPASSWORD=${password}`,
    container,
    "psql",
    "-U", user,
    "-d", database,
    "-c", "SELECT 1;",
  ];
}

export function buildPostgresLocalDumpArgs({ host, port, user, database }) {
  return [
    "-h", host,
    "-p", String(port),
    "-U", user,
    "-d", database,
    "-F", "p",
  ];
}

export function buildPostgresDockerDumpArgs({ password, container, user, database }) {
  return [
    "exec",
    "-e", `PGPASSWORD=${password}`,
    "-i",
    container,
    "pg_dump",
    "-U", user,
    "-d", database,
  ];
}

export function buildPostgresRestoreArgs({ host, port, user, database }) {
  return [
    "-h", host,
    "-p", String(port),
    "-U", user,
    "-d", database,
  ];
}

export class PostgresAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
  }

  async testConnection() {
    const { host, port, user, password, database, mode, container } = this.config;

    const { uri } = this.config;

    // 🔥 URI MODE
    if (uri) {
      const proc = spawn("psql", [
        uri,
        "-c",
        "SELECT 1;"
      ]);

      let errorOutput = "";

      proc.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve, reject) => {
        proc.on("error", (err) => {
          reject(new ConnectionError(err.message));
        });

        proc.on("close", (code) => {
          if (code === 0) resolve(true);
          else reject(new ConnectionError(errorOutput || "PostgreSQL URI connection failed"));
        });
      });
    }

    // 🐳 Docker mode
    if (mode === "docker") {
      if (!container) {
        throw new ValidationError("Docker container name is required for PostgreSQL docker mode");
      }

      const proc = spawn("docker", [
        ...buildPostgresDockerConnectionArgs({ password, container, user, database }),
      ]);

      let errorOutput = "";

      proc.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      return new Promise((resolve, reject) => {
        proc.on("close", (code) => {
          if (code === 0) resolve(true);
          else reject(new ConnectionError(errorOutput || "Docker PostgreSQL connection failed"));
        });
      });
    }

    // 🖥️ Local / Remote mode
    const proc = spawn(
      "psql",
      [
        ...buildPostgresLocalConnectionArgs({ host, port, user, database }),
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
        else reject(new ConnectionError(errorOutput || "PostgreSQL connection failed"));
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

    const safeDatabaseName = sanitizeFileComponent(database, "postgres");
    const filename = `${safeDatabaseName}_${timestamp}.sql`;
    const filePath = path.join(output, filename);

    if (verbose) {
        console.log("Starting pg_dump (local)...");
    }

    let dump;

    if (this.config.uri) {
      dump = spawn("pg_dump", [this.config.uri]);
    } else {
      dump = spawn(
        "pg_dump",
        buildPostgresLocalDumpArgs({ host, port, user, database }),
        {
          env: {
            ...process.env,
            PGPASSWORD: password,
          },
        }
      );
    }

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
                new BackupError(errorOutput || `PostgreSQL backup failed (exit code ${code})`)
              );
            }
        if (compress) {
            if (verbose) console.log("Compressing backup...");

            const gzip = spawn("gzip", [filePath]);

            gzip.on("close", (gzipCode) => {
            if (gzipCode === 0) {
                resolve(`${filePath}.gz`);
            } else {
              reject(new BackupError("Compression failed"));
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
      throw new ValidationError("Docker container name is required for docker mode");
    }

    if (!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
    }

    const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .replace("Z", "");

    const safeDatabaseName = sanitizeFileComponent(database, "postgres");
    const filename = `${safeDatabaseName}_${timestamp}.sql`;
    const filePath = path.join(output, filename);

    if (verbose) {
        console.log("Starting pg_dump (docker)...");
    }

    const dump = spawn("docker", buildPostgresDockerDumpArgs({ password, container, user, database }));

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
            new BackupError(errorOutput || `PostgreSQL backup failed (docker, exit code ${code})`)
          );
        } 

        if (compress) {
            if (verbose) console.log("Compressing backup...");

            const gzip = spawn("gzip", [filePath]);

            gzip.on("close", (gzipCode) => {
            if (gzipCode === 0) {
                resolve(`${filePath}.gz`);
            } else {
              reject(new BackupError(`Compression failed (exit code ${gzipCode})`));
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

    let restore;

    if (this.config.uri) {
      restore = spawn("psql", [this.config.uri]);
    } else {
      restore = spawn(
        "psql",
        buildPostgresRestoreArgs({ host, port, user, database }),
        {
          env: {
            ...process.env,
            PGPASSWORD: password,
          },
        }
      );
    }
    inputStream.pipe(restore.stdin);

    let errorOutput = "";

    restore.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    return new Promise((resolve, reject) => {
      restore.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new RestoreError(errorOutput || "PostgreSQL restore failed"));
      });
    });
  }
}