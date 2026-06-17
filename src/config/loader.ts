import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import dotenv from "dotenv";
import { parse } from "yaml";
import { RepoReadySchema, type RepoReadyConfig } from "./schema.js";

export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
  ) {
    super(message);
    this.name = "ConfigError";
  }
}

export function loadConfig(configPath: string): RepoReadyConfig {
  const absolutePath = resolve(configPath);
  const filename = basename(absolutePath);

  let raw: string;
  try {
    raw = readFileSync(absolutePath, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new ConfigError(`Error: Config file not found: ${absolutePath}`, 3);
    }
    throw new ConfigError(
      `Error: Could not read config file ${absolutePath}: ${(err as Error).message}`,
      3,
    );
  }

  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (err) {
    throw new ConfigError(
      `Error: ${filename} is not valid YAML: ${(err as Error).message}`,
      2,
    );
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ConfigError(
      `Error: ${filename} must be a YAML mapping (key: value), not empty or a list.`,
      2,
    );
  }

  const result = RepoReadySchema.safeParse(parsed);

  if (!result.success) {
    const lines = [`RepoReady config error in ${filename}:\n`];
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      lines.push(`  ${path || "(root)"} — ${issue.message}`);
    }
    lines.push("\nFix these errors and run repoready scan again.");
    throw new ConfigError(lines.join("\n"), 2);
  }

  return result.data;
}

export function loadEnvironment(
  config: RepoReadyConfig,
  configPath: string,
): Record<string, string> {
  const projectRoot = dirname(resolve(configPath));
  const env: Record<string, string> = {};

  for (const file of config.env?.files ?? [".env"]) {
    const envPath = resolveProjectPath(projectRoot, file);
    try {
      Object.assign(env, dotenv.parse(readFileSync(envPath, "utf-8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new ConfigError(
          `Error: Could not read environment file ${envPath}: ${(error as Error).message}`,
          3,
        );
      }
    }
  }

  return { ...env, ...process.env } as Record<string, string>;
}

export function resolveProjectPath(projectRoot: string, file: string): string {
  if (isAbsolute(file)) {
    throw new ConfigError(
      `Error: Project file paths must be relative: ${file}`,
      2,
    );
  }

  const resolved = resolve(projectRoot, file);
  const pathFromRoot = relative(projectRoot, resolved);
  if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
    throw new ConfigError(
      `Error: Project file path escapes the repository: ${file}`,
      2,
    );
  }

  if (existsSync(resolved)) {
    const realRoot = realpathSync(projectRoot);
    const realPath = realpathSync(resolved);
    const realPathFromRoot = relative(realRoot, realPath);
    if (realPathFromRoot.startsWith("..") || isAbsolute(realPathFromRoot)) {
      throw new ConfigError(
        `Error: Project file symlink escapes the repository: ${file}`,
        2,
      );
    }
  }

  return resolved;
}
