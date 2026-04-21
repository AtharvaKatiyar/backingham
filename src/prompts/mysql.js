import inquirer from "inquirer";

export async function getMySQLConfig() {
  const base = {
    db: "mysql",
  };

  // 🔥 Step 1: Connection type
  const { connectionType } = await inquirer.prompt([
    {
      type: "list",
      name: "connectionType",
      message: "Select MySQL connection type:",
      choices: ["Local", "Remote"],
    },
  ]);

  // 🔥 Common questions
  const questions = [
    {
      name: "host",
      message: "Enter database host:",
      default: "127.0.0.1",
    },
    {
      name: "port",
      message: "Enter database port:",
      default: "3306",
    },
    {
      name: "user",
      message: "Enter database user:",
    },
    {
      type: "password",
      name: "password",
      message: "Enter database password:",
    },
    {
      name: "database",
      message: "Enter database name:",
    },
    {
      name: "output",
      message: "Enter output directory:",
      default: "./backups",
    },
  ];

  const answers = await inquirer.prompt(questions);

  return {
    ...base,
    ...answers,
    connectionType,
  };
}