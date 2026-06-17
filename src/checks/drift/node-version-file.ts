import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";
import type { CheckResult, CheckContext } from "../../types.js";

export async function checkNodeVersionFileDrift(
  context: CheckContext,
): Promise<CheckResult[]> {
  const filePath = join(context.projectRoot, ".node-version");
  if (!existsSync(filePath)) return [];

  const fileVersion = readFileSync(filePath, "utf-8").trim().replace(/^v/, "");
  const configNode = context.config.runtime?.node;

  if (!configNode || !fileVersion) return [];

  const normalized = normalizeVersion(fileVersion);
  const satisfies = semver.satisfies(normalized, configNode);
  if (!satisfies) {
    return [
      {
        name: "Drift: Node version (.node-version)",
        category: "setup-drift",
        status: "warning",
        message: `.node-version specifies Node ${fileVersion} which does not satisfy repoready.yml runtime.node "${configNode}"`,
        suggestion: `Update .node-version to a version satisfying ${configNode}, or update runtime.node in repoready.yml`,
        metadata: { nodeVersionFile: fileVersion, repoready: configNode },
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
