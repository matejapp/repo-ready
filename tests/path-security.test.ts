import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ConfigError, resolveProjectPath } from "../src/config/loader.js";

describe("project path containment", () => {
  it("rejects files outside the project through a symlink", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "repoready-project-"));
    const outsideRoot = mkdtempSync(join(tmpdir(), "repoready-outside-"));
    const outsideFile = join(outsideRoot, ".env");
    writeFileSync(outsideFile, "SECRET=value\n");
    symlinkSync(outsideFile, join(projectRoot, ".env"));

    expect(() => resolveProjectPath(projectRoot, ".env")).toThrowError(
      ConfigError,
    );
  });
});
