import { z } from "zod";
import type { RepoReadyConfig } from "./config/schema.js";

export type CheckStatus = "passed" | "failed" | "warning" | "skipped";

export type CheckCategory =
  | "runtime"
  | "environment"
  | "ports"
  | "services"
  | "binaries"
  | "database"
  | "setup-drift";

export interface CheckResult {
  name: string;
  category: CheckCategory;
  status: CheckStatus;
  message: string;
  suggestion?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckContext {
  projectRoot: string;
  config: RepoReadyConfig;
  env: Record<string, string>;
}

export interface DoctorCheck {
  name: string;
  category: CheckCategory;
  run(context: CheckContext): Promise<CheckResult>;
}

export const CheckResultSchema = z.object({
  name: z.string(),
  category: z.enum([
    "runtime",
    "environment",
    "ports",
    "services",
    "binaries",
    "database",
    "setup-drift",
  ]),
  status: z.enum(["passed", "failed", "warning", "skipped"]),
  message: z.string(),
  suggestion: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
