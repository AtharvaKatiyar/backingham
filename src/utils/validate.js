//validate.js
export function validateOptions(config) {
  const missing = [];

  if (!config.db) {
    missing.push("db");
    return missing;
  }

  if (config.uri && config.uri.trim() !== "") {
    if (!config.database) missing.push("database");
    if (!config.output) missing.push("output");
    return missing;
  }

  if (config.mode === "docker") {
    if (!config.container) missing.push("container");
    if (!config.user) missing.push("user");
    if (!config.password) missing.push("password");
    if (!config.database) missing.push("database");
    if (!config.output) missing.push("output");
    return missing;
  }

  const requiredFields = [
    "host",
    "port",
    "user",
    "password",
    "database",
    "output",
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      missing.push(field);
    }
  }

  return missing;
}