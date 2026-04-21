import { listBackups } from "../../registry/registry.js";

export default function listCommand() {
  const backups = listBackups();

  if (backups.length === 0) {
    console.log("No backups found.");
    return;
  }

  console.log("\n📦 Backup History:\n");

  backups.forEach((b, i) => {
    console.log(
      `${i + 1}. [${b.id}] ${b.db} → ${b.database}\n   Size: ${b.size} bytes\n   Created: ${b.createdAt}\n   Path: ${b.path}\n`
    );
  });
}