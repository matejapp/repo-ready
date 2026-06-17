import { Command } from "commander";
import { loadConfig } from "../config/loader.js";

const program = new Command();

program
  .name("repoready")
  .description(
    "Checks whether your machine satisfies a repository's setup contract",
  )
  .version("0.1.0");

program
  .command("scan")
  .description("Run all checks defined in repoready.yml")
  .option("--config <path>", "path to config file", "repoready.yml")
  .action((options) => {
    const config = loadConfig(options.config);
    console.log(`Scanning project: ${config.project.name}`);
    console.log("Checks coming soon...");
  });

program
  .command("init")
  .description("Scaffold a starter repoready.yml in the current directory")
  .action(() => {
    import("node:fs").then(({ existsSync, writeFileSync }) => {
      if (existsSync("repoready.yml")) {
        console.error("repoready.yml already exists. Remove it first.");
        process.exit(1);
      }
      const template = `project:
    name: "my-project"
    description: ""

  runtime:
    node: ">=20"
    packageManager: "pnpm"

  env:
    required: []

  binaries:
    required:
      - git
      - node
  `;
      writeFileSync("repoready.yml", template, "utf-8");
      console.log("Created repoready.yml — edit it to match your project.");
    });
  });

program.parse();
