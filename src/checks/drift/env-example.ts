import { readFileSync, existsSync } from "node:fs";
import dotenv from "dotenv";
import type { CheckResult, CheckContext } from "../../types.js";
import { resolveProjectPath } from "../../config/loader.js";

export async function checkEnvExampleDrift(
  context: CheckContext,
): Promise<CheckResult[]> {
  const exampleFile = context.config.env?.exampleFile ?? ".env.example";
  const examplePath = resolveProjectPath(context.projectRoot, exampleFile);
  if (!existsSync(examplePath)) return [];

  const content = readFileSync(examplePath, "utf-8");
  const exampleKeys = new Set(Object.keys(dotenv.parse(content)));
  const requiredKeys = new Set(context.config.env?.required ?? []);

  const results: CheckResult[] = [];

  const inExampleNotRequired = [...exampleKeys].filter(
    (k) => !requiredKeys.has(k),
  );
  if (inExampleNotRequired.length > 0) {
    results.push({
      name: "Drift: Env vars in .env.example not in repoready.yml",
      category: "setup-drift",
      status: "warning",
      message: `${exampleFile} has vars not listed in repoready.yml env.required: ${inExampleNotRequired.join(", ")}`,
      suggestion: `Add these vars to env.required in repoready.yml, or remove them from ${exampleFile}`,
      metadata: { missing: inExampleNotRequired },
    });
  }

  const inRequiredNotExample = [...requiredKeys].filter(
    (k) => !exampleKeys.has(k),
  );
  if (inRequiredNotExample.length > 0) {
    results.push({
      name: "Drift: Env vars in repoready.yml not in .env.example",
      category: "setup-drift",
      status: "warning",
      message: `repoready.yml env.required has vars not in ${exampleFile}: ${inRequiredNotExample.join(", ")}`,
      suggestion: `Add these vars to ${exampleFile} so contributors know to set them`,
      metadata: { missing: inRequiredNotExample },
    });
  }

  return results;
}
