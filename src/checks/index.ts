import type { CheckResult, CheckContext } from "../types.js";
import { checkNodeVersion } from "./node.js";
import { checkPackageManager } from "./package-manager.js";
import { checkEnvVars } from "./env.js";
import { checkBinaries } from "./binary.js";
import { runDriftChecks } from "./drift/index.js";

export async function runChecks(context: CheckContext): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  results.push(await checkNodeVersion(context));
  results.push(await checkPackageManager(context));
  results.push(...(await checkEnvVars(context)));
  results.push(...(await checkBinaries(context)));
  results.push(...(await runDriftChecks(context)));

  return results;
}
