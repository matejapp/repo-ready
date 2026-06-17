import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";
import type { CheckResult, CheckContext } from "../../types.js";

export async function checkPackageJsonDrift(
  context: CheckContext,
): Promise<CheckResult[]> {
  const pkgPath = join(context.projectRoot, "package.json");
  if (!existsSync(pkgPath)) return [];

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  } catch {
    return [];
  }

  const results: CheckResult[] = [];
  const configNode = context.config.runtime?.node;
  const pkgNode = (pkg.engines as Record<string, string> | undefined)?.node;

  if (
    configNode &&
    pkgNode &&
    !semver.subset(configNode, pkgNode) &&
    !semver.subset(pkgNode, configNode)
  ) {
    results.push({
      name: "Drift: Node version (package.json)",
      category: "setup-drift",
      status: "warning",
      message: `repoready.yml runtime.node "${configNode}" differs from package.json engines.node "${pkgNode}"`,
      suggestion:
        "Align runtime.node in repoready.yml with engines.node in package.json",
      metadata: { repoready: configNode, packageJson: pkgNode },
    });
  }

  const configPm = context.config.runtime?.packageManager;
  const pkgPmField = pkg.packageManager as string | undefined;
  if (configPm && pkgPmField) {
    const pkgPmName = pkgPmField.split("@")[0];
    if (configPm !== pkgPmName) {
      results.push({
        name: "Drift: Package manager (package.json)",
        category: "setup-drift",
        status: "warning",
        message: `repoready.yml packageManager "${configPm}" differs from package.json packageManager "${pkgPmName}"`,
        suggestion:
          "Align runtime.packageManager in repoready.yml with packageManager in package.json",
        metadata: { repoready: configPm, packageJson: pkgPmName },
      });
    }
  }

  if (configNode && !pkgNode) {
    results.push({
      name: "Drift: Missing engines.node (package.json)",
      category: "setup-drift",
      status: "warning",
      message: `repoready.yml requires Node ${configNode} but package.json has no engines.node field`,
      suggestion: `Add "engines": { "node": "${configNode}" } to package.json`,
    });
  }

  return results;
}
