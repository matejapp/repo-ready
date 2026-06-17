import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CheckResult, CheckContext } from "../../types.js";

export async function checkMissingContract(
  context: CheckContext,
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  if (!context.config.runtime?.node) {
    const pkgPath = join(context.projectRoot, "package.json");
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if ((pkg.engines as Record<string, string> | undefined)?.node) {
          results.push({
            name: "Drift: Undeclared Node requirement",
            category: "setup-drift",
            status: "warning",
            message: `package.json has engines.node "${pkg.engines.node}" but repoready.yml has no runtime.node`,
            suggestion: `Add runtime:\n  node: "${pkg.engines.node}" to repoready.yml`,
          });
        }
      } catch {}
    }

    if (existsSync(join(context.projectRoot, ".nvmrc"))) {
      results.push({
        name: "Drift: Undeclared Node requirement (.nvmrc)",
        category: "setup-drift",
        status: "warning",
        message: ".nvmrc exists but repoready.yml has no runtime.node",
        suggestion: "Add runtime.node to repoready.yml matching your .nvmrc",
      });
    }
  }

  return results;
}
