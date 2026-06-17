import { execa } from "execa";
import type { CheckResult, CheckContext } from "../types.js";

export async function checkPackageManager(
  context: CheckContext,
): Promise<CheckResult> {
  const pm = context.config.runtime?.packageManager;
  if (!pm) {
    return {
      name: "Package manager",
      category: "runtime",
      status: "skipped",
      message: "No runtime.packageManager specified in config",
    };
  }

  const result = await execa("which", [pm], { reject: false });

  if (result.exitCode === 0) {
    return {
      name: "Package manager",
      category: "runtime",
      status: "passed",
      message: `${pm} found on PATH`,
    };
  }

  return {
    name: "Package manager",
    category: "runtime",
    status: "failed",
    message: `${pm} is not installed or not on PATH`,
    suggestion: packageManagerSuggestion(pm),
  };
}

function packageManagerSuggestion(pm: string): string {
  if (pm === "npm")
    return "Install Node.js, which includes npm: https://nodejs.org/";
  if (pm === "pnpm") return "Install pnpm: npm install -g pnpm";
  if (pm === "yarn") return "Install Yarn: corepack enable yarn";
  return "Install Bun: https://bun.sh/docs/installation";
}
