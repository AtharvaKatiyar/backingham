import inquirer from "inquirer";

export async function getMySQLConfig() {
  const base = { db: "mysql" };

  const { connectionType } = await inquirer.prompt([
    {
      type: "list",
      name: "connectionType",
      message: "Select MySQL connection type:",
      choices: ["Local", "Remote"],
    },
  ]);

  // 🖥️ LOCAL
  if (connectionType === "Local") {
    const answers = await inquirer.prompt([
      { name: "host", default: "127.0.0.1", message: "Enter database host:" },
      { name: "port", default: "3306", message: "Enter database port:" },
      { name: "user", default: "root", message: "Enter database user:" },
      { type: "password", name: "password", message: "Enter password:" },
      { name: "database", message: "Enter database name:" },
      { name: "output", default: "./backups", message: "Output directory:" },
    ]);

    return { ...base, ...answers, mode: "local" };
  }

  // 🌐 REMOTE
  const { method } = await inquirer.prompt([
    {
      type: "list",
      name: "method",
      message: "How do you want to connect?",
      choices: ["Connection URI", "Manual details"],
    },
  ]);

  // 🔥 URI MODE
  if (method === "Connection URI") {
    const answers = await inquirer.prompt([
      {
        name: "uri",
        message: "Enter MySQL connection URI:",
      },
      {
        name: "output",
        default: "./backups",
        message: "Output directory:",
      },
    ]);

    return { ...base, ...answers, mode: "remote" };
  }

  // 🔥 MANUAL MODE
  const answers = await inquirer.prompt([
    {
      name: "host",
      message: "Enter remote host (e.g., db.amazonaws.com):",
    },
    {
      name: "port",
      default: "3306",
      message: "Enter port:",
    },
    {
      name: "user",
      message: "Enter database user:",
    },
    {
      type: "password",
      name: "password",
      message: "Enter password:",
    },
    {
      name: "database",
      message: "Enter database name:",
    },
    {
      type: "confirm",
      name: "ssl",
      message: "Does this require SSL?",
      default: true,
    },
    {
      name: "output",
      default: "./backups",
      message: "Output directory:",
    },
  ]);

  return { ...base, ...answers, mode: "remote" };
}