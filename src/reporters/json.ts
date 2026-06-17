import type { CheckResult } from "../types.js";
import type { RepoReadyConfig } from "../config/schema.js";

interface JsonReport {
  project: string;
  timestamp: string;
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
  exitCode: number;
  checks: CheckResult[];
}

export function renderJson(
  results: CheckResult[],
  config: RepoReadyConfig,
  exitCode = results.some((result) => result.status === "failed") ? 1 : 0,
): string {
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  const report: JsonReport = {
    project: config.project.name,
    timestamp: new Date().toISOString(),
    summary: { passed, failed, warnings, skipped },
    exitCode,
    checks: results,
  };

  return JSON.stringify(report, null, 2);
}
