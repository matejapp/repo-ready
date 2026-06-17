import { execa } from "execa";
import type { CheckResult, CheckContext } from "../types.js";

export async function checkBinaries(
  context: CheckContext,
): Promise<CheckResult[]> {
  const required = context.config.binaries?.required;
  if (!required || required.length === 0) return [];

  const results: CheckResult[] = [];
  for (const binary of required) {
    const result = await execa("which", [binary], { reject: false });
    if (result.exitCode === 0) {
      results.push({
        name: `Binary: ${binary}`,
        category: "binaries",
        status: "passed",
        message: `${binary} found on PATH`,
      });
    } else {
      results.push({
        name: `Binary: ${binary}`,
        category: "binaries",
        status: "failed",
        message: `${binary} is not installed or not on PATH`,
        suggestion: `Install ${binary} and ensure it is on your PATH`,
      });
    }
  }
  return results;
}
