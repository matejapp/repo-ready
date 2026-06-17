import { describe, expect, it } from "vitest";
import { renderJson } from "../src/reporters/json.js";
import type { CheckResult } from "../src/types.js";

const results: CheckResult[] = [
  { name: "pass", category: "runtime", status: "passed", message: "ok" },
  { name: "fail", category: "runtime", status: "failed", message: "bad" },
  {
    name: "warn",
    category: "setup-drift",
    status: "warning",
    message: "drift",
  },
  { name: "skip", category: "database", status: "skipped", message: "missing" },
];

describe("JSON reporter", () => {
  it("returns the documented summary and exit code", () => {
    const report = JSON.parse(
      renderJson(results, { project: { name: "example" } }),
    );
    expect(report.project).toBe("example");
    expect(report.summary).toEqual({
      passed: 1,
      failed: 1,
      warnings: 1,
      skipped: 1,
    });
    expect(report.exitCode).toBe(1);
  });
});
