import { execa } from "execa";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
  CheckResultSchema,
  type CheckResult,
  type CheckContext,
} from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function buildPythonConfig(context: CheckContext): object {
  const { config } = context;
  return {
    ports: config.ports,
    services: config.services,
    database: config.database,
  };
}

function packagedDiagnosticsPath(): string {
  return join(__dirname, "..", "..", "diagnostics", "main.py");
}

export async function runPythonChecks(
  context: CheckContext,
): Promise<CheckResult[]> {
  const needsPython =
    (context.config.ports?.required?.length ?? 0) > 0 ||
    context.config.services?.docker?.required === true ||
    context.config.database?.urlEnv !== undefined;

  if (!needsPython) return [];

  const mainPyPath = packagedDiagnosticsPath();

  if (!existsSync(mainPyPath)) {
    return [
      {
        name: "Python diagnostics",
        category: "services",
        status: "failed",
        message: "Python diagnostics engine not found — reinstall repoready",
        suggestion: "Run: npm install -g repo-ready",
        metadata: { internalError: true },
      },
    ];
  }

  const pythonConfig = buildPythonConfig(context);
  const childEnv: Record<string, string> = {
    PATH: process.env.PATH ?? "",
  };
  const databaseEnv = context.config.database?.urlEnv;
  if (databaseEnv && context.env[databaseEnv] !== undefined) {
    childEnv[databaseEnv] = context.env[databaseEnv];
  }

  let stdout: string;
  try {
    const result = await execa(
      "python3",
      [mainPyPath, "--config", JSON.stringify(pythonConfig)],
      {
        env: childEnv,
        reject: false,
        timeout: 15_000,
        maxBuffer: 1_000_000,
      },
    );

    if (result.exitCode !== 0) {
      return [
        {
          name: "Python diagnostics",
          category: "services",
          status: "failed",
          message: `Python engine exited with code ${result.exitCode}: ${result.stderr.slice(0, 500)}`,
          suggestion: "Ensure Python 3.11+ is installed: python3 --version",
          metadata: { internalError: true },
        },
      ];
    }

    stdout = result.stdout;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [
        {
          name: "Python diagnostics",
          category: "services",
          status: "failed",
          message: "python3 is not installed or not on PATH",
          suggestion: "Install Python 3.11+: https://python.org/downloads/",
          metadata: { internalError: true },
        },
      ];
    }
    return [
      {
        name: "Python diagnostics",
        category: "services",
        status: "failed",
        message: `Failed to run Python engine: ${(err as Error).message}`,
        metadata: { internalError: true },
      },
    ];
  }

  try {
    const parsed = JSON.parse(stdout) as unknown;
    if (!Array.isArray(parsed)) throw new Error("expected JSON array");
    return parsed.map((result) => CheckResultSchema.parse(result));
  } catch {
    return [
      {
        name: "Python diagnostics",
        category: "services",
        status: "failed",
        message: "Python engine returned invalid JSON",
        suggestion: "This is a bug in repoready — please report it",
        metadata: { internalError: true },
      },
    ];
  }
}
