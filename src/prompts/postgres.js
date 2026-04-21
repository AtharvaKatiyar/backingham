import inquirer from "inquirer";

export async function getPostgresConfig() {
  const base = {
    db: "postgres",
  };

  const { connectionType } = await inquirer.prompt([
    {
      type: "list",
      name: "connectionType",
      message: "Select PostgreSQL connection type:",
      choices: ["Local", "Remote", "Docker"],
    },
  ]);

  if (connectionType === "Docker") {
    const answers = await inquirer.prompt([
      {
        name: "container",
        message: "Enter Docker container name:",
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
    ]);

    return {
      ...base,
      ...answers,
      mode: "docker",
    };
  }


  const questions = [
    {
      name: "host",
      message: "Enter database host:",
      default: "127.0.0.1",
    },
    {
      name: "port",
      message: "Enter database port:",
      default: "5432",
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
    mode: "local",
  };
}