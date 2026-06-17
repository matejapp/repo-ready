import chalk from "chalk";
import type { CheckCategory, CheckResult } from "../types.js";
import type { RepoReadyConfig } from "../config/schema.js";

const SYMBOLS = {
  passed: chalk.green("✓"),
  failed: chalk.red("✕"),
  warning: chalk.yellow("!"),
  skipped: chalk.yellow("!"),
};

const CATEGORY_ORDER: CheckCategory[] = [
  "runtime",
  "environment",
  "binaries",
  "ports",
  "services",
  "database",
  "setup-drift",
];

const CATEGORY_LABELS: Record<string, string> = {
  runtime: "Runtime",
  environment: "Environment",
  binaries: "Binaries",
  ports: "Ports",
  services: "Services",
  database: "Database",
  "setup-drift": "Setup Drift (warnings)",
};

export function renderReport(
  results: CheckResult[],
  config: RepoReadyConfig,
): void {
  console.log(`\nRepoReady — ${config.project.name}\n`);

  const byCategory = new Map<string, CheckResult[]>();
  for (const result of results) {
    const list = byCategory.get(result.category) ?? [];
    list.push(result);
    byCategory.set(result.category, list);
  }

  for (const category of CATEGORY_ORDER) {
    const items = byCategory.get(category);
    if (!items || items.length === 0) continue;

    console.log(chalk.bold(CATEGORY_LABELS[category]));
    for (const item of items) {
      const symbol = SYMBOLS[item.status];
      const name = item.name.padEnd(28);
      console.log(`  ${symbol}  ${name} ${item.message}`);
    }
    console.log();
  }

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log("─".repeat(60));
  const parts = [
    chalk.green(`Passed: ${passed}`),
    failed > 0
      ? chalk.red(`Failed: ${failed}`)
      : chalk.gray(`Failed: ${failed}`),
    warnings > 0
      ? chalk.yellow(`Warnings: ${warnings}`)
      : chalk.gray(`Warnings: ${warnings}`),
  ];
  if (skipped > 0) parts.push(chalk.gray(`Skipped: ${skipped}`));
  console.log(`  ${parts.join("   ")}\n`);

  const suggestions = results.filter((r) => r.suggestion);
  if (suggestions.length > 0) {
    console.log(chalk.bold("Suggested fixes:"));
    suggestions.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.suggestion}`);
    });
    console.log();
  }
}
