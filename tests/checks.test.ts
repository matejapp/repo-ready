import { describe, expect, it } from "vitest";
import { checkEnvVars } from "../src/checks/env.js";
import { checkNodeVersion } from "../src/checks/node.js";
import { checkEnvExampleDrift } from "../src/checks/drift/env-example.js";
import type { CheckContext } from "../src/types.js";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function context(overrides: Partial<CheckContext> = {}): CheckContext {
  return {
    projectRoot: process.cwd(),
    config: { project: { name: "test" } },
    env: {},
    ...overrides,
  };
}

describe("TypeScript checks", () => {
  it("passes a satisfied Node range", async () => {
    const result = await checkNodeVersion(
      context({
        config: { project: { name: "test" }, runtime: { node: ">=20" } },
      }),
    );
    expect(result.status).toBe("passed");
  });

  it("fails missing and empty environment variables", async () => {
    const results = await checkEnvVars(
      context({
        config: {
          project: { name: "test" },
          env: { required: ["MISSING", "EMPTY"] },
        },
        env: { EMPTY: "" },
      }),
    );
    expect(results.map((result) => result.status)).toEqual([
      "failed",
      "failed",
    ]);
  });

  it("reports env example drift in both directions", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "repoready-drift-"));
    writeFileSync(join(projectRoot, ".env.example"), "DATABASE_URL=\nEXTRA=\n");
    const results = await checkEnvExampleDrift(
      context({
        projectRoot,
        config: {
          project: { name: "test" },
          env: {
            exampleFile: ".env.example",
            required: ["DATABASE_URL", "MISSING"],
          },
        },
      }),
    );
    expect(results).toHaveLength(2);
    expect(results.every((result) => result.status === "warning")).toBe(true);
  });
});
