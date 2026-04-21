//create.js
import { normalizeOptions } from "../../utils/normalize.js";
import { getAdapter } from "../../adapters/adaptorFactory.js";
import { getMongoConfig } from "../../prompts/mongo.js";
import { getMySQLConfig } from "../../prompts/mysql.js";
import { getPostgresConfig } from "../../prompts/postgres.js";
import inquirer from "inquirer";
import { addBackup } from "../../registry/registry.js";
import fs from "fs";
import path from "path";
import { formatError, ValidationError } from "../../utils/errors.js";

function inferDatabaseName(config) {
  if (config?.database) {
    return config.database;
  }

  if (config?.uri) {
    try {
      const parsed = new URL(config.uri.trim());
      const dbFromPath = parsed.pathname.replace(/^\/+/, "").split("/")[0];

      if (dbFromPath) {
        return decodeURIComponent(dbFromPath);
      }
    } catch {
      // ignore invalid URI, fallback below
    }
  }

  return config?.db || "database";
}

export default async function createBackup(options) {
  try {
    console.log("Starting backup process...");

    let config = normalizeOptions(options);
    if (!config.db) {
      const { db } = await inquirer.prompt([
        {
          type: "list",
          name: "db",
          message: "Select database type:",
          choices: ["mongodb", "mysql", "postgres"],
        },
      ]);
      config.db = db;
    }

    if (config.db === "mongodb") {
      config = { ...config, ...(await getMongoConfig()) };
    } else if (config.db === "mysql") {
      config = { ...config, ...(await getMySQLConfig()) };
    } else if (config.db === "postgres") {
      config = { ...config, ...(await getPostgresConfig()) };
    } else {
      throw new ValidationError("Unsupported database type selected", { db: config.db });
    }
    console.log(`Using adapter: ${config.db}`);

    const adapter = getAdapter(config);
    await adapter.testConnection();
    const file = await adapter.backup();
    console.log("Backup created successfully at:", file);

    const stats = fs.statSync(file);
    const database = inferDatabaseName(config);

    const entry = {
      id: Date.now().toString(),
      db: config.db,
      database,
      path: path.resolve(file),

      // 🔥 ADD THIS (CRITICAL)
      connection: {
        uri: config.uri,
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        mode: config.mode,
        container: config.container,
      },

      size: stats.size,
      compressed: file.endsWith(".gz") || file.endsWith(".tar.gz"),
      createdAt: new Date().toISOString(),
    };
    addBackup(entry);


  } catch (err) {
    console.error("Backup operation failed:", formatError(err));
  }
}