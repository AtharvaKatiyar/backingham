import { input, password, select } from "@inquirer/prompts";

export async function promptMissingFields(missingFields, current) {
  const answers = {};

  if (missingFields.includes("db")) {
    answers.db = await select({
      message: "Select database type:",
      choices: [
        { name: "MySQL", value: "mysql" },
        { name: "PostgreSQL", value: "postgres" },
        { name: "MongoDB", value: "mongodb" },
      ],
    });
  }
  if (missingFields.includes("host")) {
      answers.host = await input({
          message: "Enter database host:",
          default: "localhost",
        }); 
  }
    if(missingFields.includes("port")) {
      answers.port = await input({
        message: "Enter database port:",
        default: answers.db === "mysql" ? "3306" : answers.db === "postgres" ? "5432" : answers.db === "mongodb" ? "27017" : "",
      });
    }
  if(missingFields.includes("user")) {
    answers.user = await input({
      message: "Enter database user:",
      default: "root",
    });
  }
  if (missingFields.includes("password")) {
    answers.password = await password({
      message: "Enter database password:",
      mask: "*",
    });
  }

  if (missingFields.includes("database")) {
    answers.database = await input({
      message: "Enter database name:",
    });
  }
  if (missingFields.includes("output")) {
    answers.output = await input({
      message: "Enter output directory:",
      default: "./backups",
    });
  }

  return answers;
}