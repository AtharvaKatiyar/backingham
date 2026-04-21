//exec.js
import { exec } from "child_process";

export function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("STDERR:", stderr);
        console.error("ERROR:", error);

        return reject(
          stderr?.toString() ||
          error.message ||
          JSON.stringify(error) ||
          "Unknown error"
        );
      }
      resolve(stdout);
    });
  });
}