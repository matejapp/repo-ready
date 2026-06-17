import semver from "semver";
import type { CheckResult, CheckContext } from "../types.js";

export async function checkNodeVersion(
  context: CheckContext,
): Promise<CheckResult> {
  const range = context.config.runtime?.node;
  if (!range) {
    return {
      name: "Node version",
      category: "runtime",
      status: "skipped",
      message: "No runtime.node range specified in config",
    };
  }

  const current = process.version;
  const satisfies = semver.satisfies(current, range);

  if (satisfies) {
    return {
      name: "Node version",
      category: "runtime",
      status: "passed",
      message: `${current} satisfies ${range}`,
      metadata: { current, required: range },
    };
  }

  return {
    name: "Node version",
    category: "runtime",
    status: "failed",
    message: `${current} does not satisfy ${range}`,
    suggestion: `Install Node.js ${range} — use nvm: nvm install ${range}`,
    metadata: { current, required: range },
  };
}
