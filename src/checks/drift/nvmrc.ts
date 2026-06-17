import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";
import type { CheckResult, CheckContext } from "../../types.js";

export async function checkNvmrcDrift(
  context: CheckContext,
): Promise<CheckResult[]> {
  const nvmrcPath = join(context.projectRoot, ".nvmrc");
  if (!existsSync(nvmrcPath)) return [];

  const nvmrcVersion = readFileSync(nvmrcPath, "utf-8")
    .trim()
    .replace(/^v/, "");
  const configNode = context.config.runtime?.node;

  if (!configNode || !nvmrcVersion) return [];

  const normalized = normalizeVersion(nvmrcVersion);
  const satisfies = semver.satisfies(normalized, configNode);
  if (!satisfies) {
    return [
      {
        name: "Drift: Node version (.nvmrc)",
        category: "setup-drift",
        status: "warning",
        message: `.nvmrc specifies Node ${nvmrcVersion} which does not satisfy repoready.yml runtime.node "${configNode}"`,
        suggestion: `Update .nvmrc to a version satisfying ${configNode}, or update runtime.node in repoready.yml`,
        metadata: { nvmrc: nvmrcVersion, repoready: configNode },
      },
    ];
  }

  return [];
}

function normalizeVersion(version: string): string {
  if (/^\d+$/.test(version)) return `${version}.0.0`;
  if (/^\d+\.\d+$/.test(version)) return `${version}.0`;
  return semver.coerce(version)?.version ?? version;
}
