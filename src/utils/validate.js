//validate.js
export function validateOptions(config) {
  const missing = [];

  if (!config.db) missing.push("db");

  if (config.db === "mongodb") {
    if (!config.uri) {
      if (!config.host) missing.push("host");
      if (!config.port) missing.push("port");
    }

    if (!config.database) missing.push("database");
    if (!config.output) missing.push("output");

    return missing;
  }

  const requiredFields = ["host", "port", "user", "password", "database", "output"];

  for (const field of requiredFields) {
    if (!config[field]) {
      missing.push(field);
    }
  }

  return missing;
}