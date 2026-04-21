import fs from "fs";
import { deleteBackup, getBackupById } from "../../registry/registry.js";

export default function deleteCommand(id) {
  const backup = getBackupById(id);

  if (!backup) {
    console.error("Backup not found");
    return;
  }

  if (fs.existsSync(backup.path)) {
    fs.rmSync(backup.path, { recursive: true, force: true });
  }

  deleteBackup(id);

  console.log("🗑️ Backup deleted");
}   