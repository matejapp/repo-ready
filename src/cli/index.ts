#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import ora from "ora";
import semver from "semver";
import { runPythonChecks } from "../bridge/python.js";
import { runChecks } from "../checks/index.js";
import { ConfigError, loadConfig, loadEnvironment } from "../config/loader.js";
import { renderJson } from "../reporters/json.js";
import { renderReport } from "../reporters/terminal.js";
import type { CheckContext, CheckResult } from "../types.js";

export function createProgram(): Command {
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
    .option("--json", "print a machine-readable JSON report")
    .action(async (options: { config: string; json?: boolean }) => {
      try {
        const configPath = resolve(options.config);
        const config = loadConfig(configPath);
        const context: CheckContext = {
          projectRoot: dirname(configPath),
          config,
          env: loadEnvironment(config, configPath),
        };

        const spinner = options.json
          ? undefined
          : ora("Running checks").start();
        const results = [
          ...(await runChecks(context)),
          ...(await runPythonChecks(context)),
        ];
        spinner?.stop();

        const exitCode = getExitCode(results);
        if (options.json) {
          process.stdout.write(`${renderJson(results, config, exitCode)}\n`);
        } else {
          renderReport(results, config);
        }
        process.exitCode = exitCode;
      } catch (error) {
        const exitCode = error instanceof ConfigError ? error.exitCode : 3;
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = exitCode;
      }
    });

  program
    .command("init")
    .description("Scaffold a starter repoready.yml in the current directory")
    .action(() => {
      const outputPath = resolve("repoready.yml");
      if (existsSync(outputPath)) {
        console.error("repoready.yml already exists. Remove it first.");
        process.exitCode = 1;
        return;
      }

      writeFileSync(outputPath, createStarterConfig(process.cwd()), "utf-8");
      console.log("Created repoready.yml — edit it to match your project.");
    });

  program
    .command("checks")
    .description("List available check types")
    .action(() => {
      console.log(`Available checks:
  node-version       Installed Node.js satisfies runtime.node
  package-manager    Required package manager is on PATH
  environment        Required variables exist and are non-empty
  binaries           Required commands are on PATH
  ports              Required ports are available
  docker             Docker daemon is running when required
  database-url       Database URL has the expected scheme and hostname
  setup-drift        Project metadata agrees with repoready.yml`);
    });

  return program;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await createProgram().parseAsync();
}

function getExitCode(results: CheckResult[]): number {
  if (results.some((result) => result.metadata?.internalError === true))
    return 3;
  return results.some((result) => result.status === "failed") ? 1 : 0;
}

function createStarterConfig(projectRoot: string): string {
  const projectName = readPackageName(projectRoot) ?? "my-project";
  const nodeRange = detectNodeRange(projectRoot) ?? ">=20";

  return `# RepoReady setup contract. Remove sections your project does not need.
project:
  name: "${projectName}"
  description: ""

runtime:
  node: "${nodeRange}"
  packageManager: "pnpm"

env:
  files:
    - ".env"
  exampleFile: ".env.example"
  required: []

ports:
  required: []

services:
  docker:
    required: false

binaries:
  required:
    - git
    - node
`;
}

function readPackageName(projectRoot: string): string | undefined {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(projectRoot, "package.json"), "utf-8"),
    ) as { name?: string };
    return pkg.name;
  } catch {
    return undefined;
  }
}

function detectNodeRange(projectRoot: string): string | undefined {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(projectRoot, "package.json"), "utf-8"),
    ) as { engines?: { node?: string } };
    if (pkg.engines?.node && semver.validRange(pkg.engines.node)) {
      return pkg.engines.node;
    }
  } catch {
    // Fall through to .nvmrc.
  }

  try {
    const version = readFileSync(resolve(projectRoot, ".nvmrc"), "utf-8")
      .trim()
      .replace(/^v/, "");
    const coerced = semver.coerce(version);
    return coerced ? `>=${coerced.major}` : undefined;
  } catch {
    return undefined;
  }
}
