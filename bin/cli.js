#!/usr/bin/env node
import { Command } from "commander";
import createBackup from "../src/commands/backup/create.js";
import listCommand from "../src/commands/backup/list.js";
import restoreCommand from "../src/commands/backup/restore.js";
import deleteCommand from "../src/commands/backup/delete.js";

const program = new Command();

program
    .name('backinghum')
    .description('A CLI tool for database backups and restores')
    .version('1.0.0');

program
  .command('backup:create')
  .description('Create a backup of the database')
  .option('-c, --compress', 'Enable compression')
  .option('-v, --verbose', 'Enable verbose output')
  .action(createBackup);


program
  .command("backup:list")
  .description("List all backups")
  .action(listCommand);


program
  .command("backup:restore <id>")
  .description("Restore a backup by ID")
  .action(restoreCommand);

program
  .command("backup:delete <id>")
  .description("Delete a backup")
  .action(deleteCommand);

program.parse();