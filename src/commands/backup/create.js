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

export default async function createBackup(options) {
  try {
    console.log("Starting backup...");

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
    }
    console.log("Final Config:", config);

    const adapter = getAdapter(config);
    await adapter.testConnection();
    const file = await adapter.backup();
    console.log("Backup created at:", file);

    const stats = fs.statSync(file);

    const entry = {
      id: Date.now().toString(),
      db: config.db,
      database: config.database,
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
    console.error("Error:", err?.message || err);
  }
}