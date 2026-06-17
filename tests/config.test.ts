import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ConfigError,
  loadConfig,
  loadEnvironment,
} from "../src/config/loader.js";

function tempFile(name: string, content: string): string {
  const directory = mkdtempSync(join(tmpdir(), "repoready-"));
  const path = join(directory, name);
  writeFileSync(path, content);
  return path;
}

describe("config loading", () => {
  it("loads a valid config", () => {
    const path = tempFile(
      "repoready.yml",
      'project:\n  name: example\nruntime:\n  node: ">=20"\n',
    );
    expect(loadConfig(path).project.name).toBe("example");
  });

  it("rejects invalid semver with exit code 2", () => {
    const path = tempFile(
      "repoready.yml",
      "project:\n  name: example\nruntime:\n  node: definitely-not-semver\n",
    );
    expect(() => loadConfig(path)).toThrowError(ConfigError);
    try {
      loadConfig(path);
    } catch (error) {
      expect((error as ConfigError).exitCode).toBe(2);
      expect((error as Error).message).toContain("runtime.node");
    }
  });

  it("loads multiple env files in order without printing values", () => {
    const configPath = tempFile(
      "repoready.yml",
      'project:\n  name: example\nenv:\n  files: [".env", ".env.local"]\n',
    );
    const directory = join(configPath, "..");
    writeFileSync(join(directory, ".env"), "FIRST=one\nSHARED=first\n");
    writeFileSync(join(directory, ".env.local"), "SECOND=two\nSHARED=second\n");
    const env = loadEnvironment(loadConfig(configPath), configPath);
    expect(env.FIRST).toBe("one");
    expect(env.SECOND).toBe("two");
    expect(env.SHARED).toBe("second");
  });
});
