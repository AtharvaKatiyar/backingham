export function sanitizeFileComponent(value, fallback = "backup") {
  const sanitized = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+/, "")
    .replace(/^_+|_+$/g, "");

  return sanitized || fallback;
}
