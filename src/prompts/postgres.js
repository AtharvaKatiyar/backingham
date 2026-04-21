import inquirer from "inquirer";

export async function getPostgresConfig() {
  const base = { db: "postgres" };

  const { connectionType } = await inquirer.prompt([
    {
      type: "list",
      name: "connectionType",
      message: "Select PostgreSQL connection type:",
      choices: ["Local", "Remote", "Docker"],
    },
  ]);

  // 🐳 Docker (same as before)
  if (connectionType === "Docker") {
    const answers = await inquirer.prompt([
      { name: "container", message: "Enter container name:" },
      { name: "user", message: "Enter user:" },
      { type: "password", name: "password" },
      { name: "database" },
      { name: "output", default: "./backups" },
    ]);

    return { ...base, ...answers, mode: "docker" };
  }

  // 🖥️ LOCAL
  if (connectionType === "Local") {
    const answers = await inquirer.prompt([
      { name: "host", default: "127.0.0.1" },
      { name: "port", default: "5432" },
      { name: "user", default: "postgres" },
      { type: "password", name: "password" },
      { name: "database" },
      { name: "output", default: "./backups" },
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
        message: "Enter PostgreSQL connection URI:",
      },
      {
        name: "output",
        default: "./backups",
      },
    ]);

    return { ...base, ...answers, mode: "remote" };
  }

  // 🔥 Manual mode (fallback)
  const answers = await inquirer.prompt([
    { name: "host", message: "Enter host:" },
    { name: "port", default: "5432" },
    { name: "user", message: "Enter user:" },
    { type: "password", name: "password" },
    { name: "database" },
    {
      type: "list",
      name: "sslmode",
      choices: ["disable", "require"],
      default: "require",
    },
    { name: "output", default: "./backups" },
  ]);

  return { ...base, ...answers, mode: "remote" };
}