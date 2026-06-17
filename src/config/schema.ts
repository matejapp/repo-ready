import { z } from "zod";
import semver from "semver";

export const RepoReadySchema = z.object({
  project: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),

  runtime: z
    .object({
      node: z
        .string()
        .optional()
        .refine((v) => v === undefined || semver.validRange(v) !== null, {
          message:
            'runtime.node must be a valid semver range (e.g. ">=20", "^18.0.0")',
        }),
      packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]).optional(),
    })
    .optional(),

  env: z
    .object({
      files: z.array(z.string()).optional(),
      exampleFile: z.string().optional(),
      required: z.array(z.string()).optional(),
    })
    .optional(),

  ports: z
    .object({
      required: z.array(z.number().int().min(1).max(65535)).optional(),
    })
    .optional(),

  services: z
    .object({
      docker: z
        .object({
          required: z.boolean(),
        })
        .optional(),
    })
    .optional(),

  binaries: z
    .object({
      required: z.array(z.string()).optional(),
    })
    .optional(),

  database: z
    .object({
      urlEnv: z.string(),
      type: z.enum(["postgres", "mysql", "mongodb", "redis"]),
    })
    .optional(),

  metadata: z
    .object({
      compare: z
        .object({
          packageJson: z.boolean().default(true),
          nvmrc: z.boolean().default(true),
          nodeVersionFile: z.boolean().default(true),
          envExample: z.boolean().default(true),
          readme: z.boolean().default(false),
        })
        .optional(),
    })
    .optional(),

  commands: z
    .object({
      install: z.string().optional(),
      dev: z.string().optional(),
    })
    .optional(),
});

export type RepoReadyConfig = z.infer<typeof RepoReadySchema>;
