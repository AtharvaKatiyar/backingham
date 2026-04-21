//normalize.js
export function normalizeOptions(options) {
  return {
    db: options.db,
    uri: options.uri,
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: options.database,
    output: options.output,
    compress: options.compress || false,
    verbose: options.verbose || false,
    mode: options.mode || "local",
    container: options.container || null,
  };
}