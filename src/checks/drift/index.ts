import type { CheckResult, CheckContext } from "../../types.js";
import { checkPackageJsonDrift } from "./package-json.js";
import { checkNvmrcDrift } from "./nvmrc.js";
import { checkNodeVersionFileDrift } from "./node-version-file.js";
import { checkEnvExampleDrift } from "./env-example.js";
import { checkReadmeDrift } from "./readme.js";
import { checkMissingContract } from "./missing-contract.js";

export async function runDriftChecks(
  context: CheckContext,
): Promise<CheckResult[]> {
  const compare = context.config.metadata?.compare;
  const results: CheckResult[] = [];

  if (compare?.packageJson !== false) {
    results.push(...(await checkPackageJsonDrift(context)));
  }
  if (compare?.nvmrc !== false) {
    results.push(...(await checkNvmrcDrift(context)));
  }
  if (compare?.nodeVersionFile !== false) {
    results.push(...(await checkNodeVersionFileDrift(context)));
  }
  if (compare?.envExample !== false) {
    results.push(...(await checkEnvExampleDrift(context)));
  }
  if (compare?.readme === true) {
    results.push(...(await checkReadmeDrift(context)));
  }

  if (compare?.packageJson !== false || compare?.nvmrc !== false) {
    results.push(...(await checkMissingContract(context)));
  }

  return results;
}
