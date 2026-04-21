import fs from "fs";
import { deleteBackup, getBackupById } from "../../registry/registry.js";
import { formatError } from "../../utils/errors.js";

export default function deleteCommand(id) {
  try {
    const backup = getBackupById(id);

    if (!backup) {
      console.error(`Backup not found for id: ${id}`);
      return;
    }

    if (fs.existsSync(backup.path)) {
      fs.rmSync(backup.path, { recursive: true, force: true });
    }

    deleteBackup(id);

    console.log("Backup deleted successfully");
  } catch (err) {
    console.error("Delete operation failed:", formatError(err));
  }
}   