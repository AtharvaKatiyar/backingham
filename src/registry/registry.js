//registry.js
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { RegistryError, ValidationError } from "../utils/errors.js";

const DEFAULT_REGISTRY_DIR = path.join(os.homedir(), ".db_backup");
const DEFAULT_REGISTRY_PATH = path.join(DEFAULT_REGISTRY_DIR, "backupRegistry.json");
const USER_HOME = path.resolve(os.homedir());

function isValidConnection(conn) {
  if (!conn) return false;

  if (conn.uri) return true;

  if (conn.mode === "docker") {
    return conn.container && conn.user && conn.password;
  }

  return conn.host && conn.port && conn.user && conn.password;
}

function getRegistryPath() {
  const customPath = process.env.DB_BACKUP_REGISTRY_PATH?.trim();

  if (!customPath) {
    return DEFAULT_REGISTRY_PATH;
  }

  const resolvedCustomPath = path.resolve(customPath);
  const relativeToHome = path.relative(USER_HOME, resolvedCustomPath);
  const isInsideHome = relativeToHome === "" || (!relativeToHome.startsWith("..") && !path.isAbsolute(relativeToHome));

  if (!isInsideHome) {
    return DEFAULT_REGISTRY_PATH;
  }

  return resolvedCustomPath;
}

function ensureRegistryFile() {
  const registryPath = getRegistryPath();
  const registryDir = path.dirname(registryPath);

  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true, mode: 0o700 });
  }

  if (!fs.existsSync(registryPath)) {
    fs.writeFileSync(registryPath, "[]", { mode: 0o600 });
  }

  return registryPath;
}

function readRegistry() {
  try {
    const registryPath = ensureRegistryFile();

    const raw = fs.readFileSync(registryPath, "utf-8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      throw new RegistryError("Registry file format is invalid (expected JSON array)");
    }

    return parsed;
  } catch (err) {
    if (err instanceof RegistryError) {
      throw err;
    }

    throw new RegistryError("Failed to read backup registry", { cause: err?.message || String(err) });
  }
}

function writeRegistry(data) {
  try {
    const registryPath = ensureRegistryFile();
    fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new RegistryError("Failed to write backup registry", { cause: err?.message || String(err) });
  }
}

export function addBackup(entry) {
  if (!isValidConnection(entry.connection)) {
    throw new ValidationError("Invalid backup entry: connection details missing");
  }

  if (!entry?.id || !entry?.db || !entry?.database || !entry?.path) {
    throw new ValidationError("Invalid backup entry: required fields are missing");
  }

  const registry = readRegistry();
  registry.push(entry);
  writeRegistry(registry);
}

export function listBackups() {
  return readRegistry();
}

export function getBackupById(id) {
  if (!id) {
    throw new ValidationError("Backup id is required");
  }

  const registry = readRegistry();
  return registry.find(b => b.id === id);
}

export function deleteBackup(id) {
  if (!id) {
    throw new ValidationError("Backup id is required");
  }

  const registry = readRegistry();
  const updated = registry.filter(b => b.id !== id);
  writeRegistry(updated);
}