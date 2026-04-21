import inquirer from "inquirer";

export async function getMongoConfig() {
  const base = {
    db: "mongodb",
  };

  // 🔥 Step 1: Connection type
  const { connectionType } = await inquirer.prompt([
    {
      type: "list",
      name: "connectionType",
      message: "Select MongoDB connection type:",
      choices: ["Local", "MongoDB Atlas (URI)"],
    },
  ]);

  // =========================
  // ☁️ Atlas Flow
  // =========================
  if (connectionType === "MongoDB Atlas (URI)") {
    const answers = await inquirer.prompt([
      {
        name: "uri",
        message: "Enter MongoDB URI:",
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
    };
  }

  // =========================
  // 🖥️ Local Flow
  // =========================

  const { requiresAuth } = await inquirer.prompt([
    {
      type: "confirm",
      name: "requiresAuth",
      message: "Does your MongoDB require authentication?",
      default: true,
    },
  ]);

  const commonQuestions = [
    {
      name: "host",
      message: "Enter database host:",
      default: "127.0.0.1",
    },
    {
      name: "port",
      message: "Enter database port:",
      default: "27017",
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

  let authQuestions = [];

  if (requiresAuth) {
    authQuestions = [
      {
        name: "user",
        message: "Enter database user:",
      },
      {
        type: "password",
        name: "password",
        message: "Enter database password:",
      },
    ];
  }

  const answers = await inquirer.prompt([
    ...commonQuestions.slice(0, 2), // host, port
    ...authQuestions,
    ...commonQuestions.slice(2),   // database, output
  ]);

  return {
    ...base,
    ...answers,
  };
}