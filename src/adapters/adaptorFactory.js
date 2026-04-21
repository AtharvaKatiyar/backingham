//adaptorFactory.js
import { MySQLAdapter } from "./mysqlAdaptor.js";
import { PostgresAdapter } from "./postgresAdapter.js";
import { MongoAdapter } from "./mongoAdapter.js";
import { ValidationError } from "../utils/errors.js";


export function getAdapter(config) {
  if (!config?.db) {
    throw new ValidationError("Database type is required in config", { field: "db" });
  }

  const db = String(config.db).toLowerCase();

  switch (db) {
    case "mysql":
      return new MySQLAdapter(config);

    case "postgres":
      return new PostgresAdapter(config);

    case "mongodb":
      return new MongoAdapter(config);

    default:
      throw new ValidationError(`Unsupported database type: ${db}`);
  }
}