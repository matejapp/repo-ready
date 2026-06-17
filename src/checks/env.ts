import type { CheckResult, CheckContext } from "../types.js";

export async function checkEnvVars(
  context: CheckContext,
): Promise<CheckResult[]> {
  const required = context.config.env?.required;
  if (!required || required.length === 0) return [];

  return required.map((varName) => {
    const value = context.env[varName];
    const present = value !== undefined && value !== "";

    if (present) {
      return {
        name: `Env: ${varName}`,
        category: "environment" as const,
        status: "passed" as const,
        message: `${varName} is set`,
      };
    }

    return {
      name: `Env: ${varName}`,
      category: "environment" as const,
      status: "failed" as const,
      message: `${varName} is not set or is empty`,
      suggestion: `Add ${varName} to your .env file`,
    };
  });
}
