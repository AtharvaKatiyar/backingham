import fs from "fs";
import path from "path";

const REGISTRY_PATH = path.resolve("src/registry/backupRegistry.json");

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    fs.writeFileSync(REGISTRY_PATH, "[]");
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
}

function writeRegistry(data) {
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
}

export function addBackup(entry) {
  const registry = readRegistry();
  registry.push(entry);
  writeRegistry(registry);
}

export function listBackups() {
  return readRegistry();
}

export function getBackupById(id) {
  const registry = readRegistry();
  return registry.find(b => b.id === id);
}

export function deleteBackup(id) {
  const registry = readRegistry();
  const updated = registry.filter(b => b.id !== id);
  writeRegistry(updated);
}