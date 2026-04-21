//mysqlAdaptor.js
import { BaseAdapter } from "./baseAdapter.js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { BackupError, ConnectionError, RestoreError } from "../utils/errors.js";
import { sanitizeFileComponent } from "../utils/sanitize.js";

export function normalizeMySQLHost(host) {
  return host === "localhost" ? "127.0.0.1" : host;
}

function parseMySQLUri(uri) {
  const url = new URL(uri);

  return {
    host: url.hostname,
    port: url.port || "3306",
    user: url.username,
    password: url.password,
    database: url.pathname.replace("/", ""),
  };
}

export function buildMySQLClientArgs({ host, port, user, password, database }) {
  return [
    "-h", normalizeMySQLHost(host),
    "-P", String(port),
    "-u", user,
    `-p${password}`,
    database,
  ];
}

export function buildMySQLDumpArgs({ host, port, user, password, database }) {
  return [
    "-h", normalizeMySQLHost(host),
    "-P", String(port),
    "-u", user,
    `-p${password}`,
    database,
  ];
}

export class MySQLAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
  }

  async testConnection() {
    const { host, port, user, password, uri } = this.config;

    let proc;

    if (uri) {
      const parsed = parseMySQLUri(uri);

      proc = spawn(
        "mysql",
        [
          "-h", normalizeMySQLHost(parsed.host),
          "-P", String(parsed.port),
          "-u", parsed.user,
          `-p${parsed.password}`,
          "-e", "SELECT 1;"
        ]
      );
    } else {
      proc = spawn(
        "mysql",
        [
          "-h", normalizeMySQLHost(host),
          "-P", String(port),
          "-u", user,
          `-p${password}`,
          "-e", "SELECT 1;"
        ]
      );
    }

    return new Promise((resolve, reject) => {
      proc.on("error", (err) => {
        reject(new ConnectionError(err.message));
      });

      proc.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new ConnectionError("MySQL connection failed"));
      });
    });
  }
  async backup() {
    const { host, port, user, password, database, output, compress, verbose, uri } =
      this.config;

    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .replace("Z", "");

    const safeDatabaseName = sanitizeFileComponent(database, "mysql");
    const filename = `${safeDatabaseName}_${timestamp}.sql`;
    const filePath = path.join(output, filename);

    if (verbose) {
      console.log("Starting mysqldump...");
    }

    let dump;

    if (uri) {
      const parsed = parseMySQLUri(uri);

      dump = spawn(
        "mysqldump",
        buildMySQLDumpArgs(parsed)
      );
    } else {
      dump = spawn(
        "mysqldump",
        buildMySQLDumpArgs({ host, port, user, password, database })
      );
    }

    const fileStream = fs.createWriteStream(filePath);

    dump.stdout.pipe(fileStream);

    let errorOutput = "";

    dump.stderr.on("data", (data) => {
      const msg = data.toString();
      errorOutput += msg;

      if (verbose) {
        console.error("mysqldump error:", msg);
      }
    });



    return new Promise((resolve, reject) => {
      dump.on("close", (code) => {
        if (code !== 0) {
          return reject(
            new BackupError(errorOutput || `MySQL backup failed (exit code ${code})`)
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

  async restore(filePath) {
    const { host, port, user, password, database, uri } = this.config;

    let inputStream;

    if (filePath.endsWith(".gz")) {
      const gunzip = spawn("gunzip", ["-c", filePath]);
      inputStream = gunzip.stdout;
    } else {
      inputStream = fs.createReadStream(filePath);
    }

    let restore;

    if (uri) {
      const parsed = parseMySQLUri(uri);

      restore = spawn(
        "mysql",
        buildMySQLClientArgs(parsed)
      );
    } else {
      restore = spawn(
        "mysql",
        buildMySQLClientArgs({ host, port, user, password, database })
      );
    }

    inputStream.pipe(restore.stdin);

    return new Promise((resolve, reject) => {
      restore.on("close", (code) => {
        if (code === 0) resolve(true);
        else reject(new RestoreError("MySQL restore failed"));
      });
    });
  }
}