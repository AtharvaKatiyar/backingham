import { getBackupById } from "../../registry/registry.js";
import { getAdapter } from "../../adapters/adaptorFactory.js";
import inquirer from "inquirer";
import { formatError } from "../../utils/errors.js";


export default async function restoreCommand(id) {
  try {
    const backup = getBackupById(id);

    if (!backup) {
      console.error(`Backup not found for id: ${id}`);
      return;
    }

    if (!backup.connection) {
      console.error("Connection details are missing for this backup entry");
      return;
    }

    console.log("Preparing restore for:", backup.path);

    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "Select restore mode:",
        choices: [
          { name: "Merge (keep existing data)", value: "merge" },
          { name: "Replace (drop existing data)", value: "replace" },
        ],
      },
    ]);
    if (mode === "replace") {
      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message: "⚠️ This will DELETE existing data. Continue?",
          default: false,
        },
      ]);

      if (!confirm) {
        console.log("Restore cancelled.");
        return;
      }
    }

    const adapter = getAdapter({
      db: backup.db,
      database: backup.database,
      restoreMode: mode,
      ...backup.connection,
    });

    await adapter.restore(backup.path);

    console.log("Restore completed successfully");
  } catch (err) {
    console.error("Restore operation failed:", formatError(err));
  }
}