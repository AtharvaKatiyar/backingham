//adaptorFactory.js
import { MySQLAdapter } from "./mysqlAdaptor.js";
import { PostgresAdapter } from "./postgresAdapter.js";
import { MongoAdapter } from "./mongoAdapter.js";


export function getAdapter(config) {
  const db = config.db.toLowerCase();

  switch (db) {
    case "mysql":
      return new MySQLAdapter(config);

    case "postgres":
      return new PostgresAdapter(config);

    case "mongodb":
      return new MongoAdapter(config);

    default:
      throw new Error(`Unsupported database type: ${db}`);
  }
}