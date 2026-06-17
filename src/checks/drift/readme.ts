import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";
import type { CheckResult, CheckContext } from "../../types.js";

export async function checkReadmeDrift(
  context: CheckContext,
): Promise<CheckResult[]> {
  const readmePath = join(context.projectRoot, "README.md");
  if (!existsSync(readmePath)) return [];

  const content = readFileSync(readmePath, "utf-8");
  const configNode = context.config.runtime?.node;
  if (!configNode) return [];

  const match = content.match(/node[.:@\s>=^~]+v?([\d]+(?:\.[\d]+)*)/i);
  if (!match) return [];

  const readmeVersion = match[1];
  const normalized = /^\d+$/.test(readmeVersion)
    ? `${readmeVersion}.0.0`
    : /^\d+\.\d+$/.test(readmeVersion)
      ? `${readmeVersion}.0`
      : (semver.coerce(readmeVersion)?.version ?? readmeVersion);
  const satisfies = semver.satisfies(normalized, configNode);

  if (!satisfies) {
    return [
      {
        name: "Drift: Node version (README)",
        category: "setup-drift",
        status: "warning",
        message: `README mentions Node ${readmeVersion} which does not satisfy repoready.yml runtime.node "${configNode}"`,
        suggestion:
          "Update the Node version mentioned in README to match repoready.yml",
        metadata: { readme: readmeVersion, repoready: configNode },
      },
    ];
  }

  return [];
}
