 import { z } from 'zod';

  export const RepoReadySchema = z.object({
    project: z.object({
      name: z.string(),
      description: z.string().optional(),
    }),

    runtime: z.object({
      node: z.string().optional(),
      packageManager: z.enum(['npm', 'pnpm', 'yarn', 'bun']).optional(),
    }).optional(),

    env: z.object({
      files: z.array(z.string()).optional(),
      exampleFile: z.string().optional(),
      required: z.array(z.string()).optional(),
    }).optional(),

    ports: z.object({
      required: z.array(z.number()).optional(),
    }).optional(),

    services: z.object({
      docker: z.object({
        required: z.boolean(),
      }).optional(),
    }).optional(),

    binaries: z.object({
      required: z.array(z.string()).optional(),
    }).optional(),

    database: z.object({
      urlEnv: z.string().optional(),
      type: z.enum(['postgres', 'mysql', 'mongodb', 'redis']).optional(),
    }).optional(),
  });

  export type RepoReadyConfig = z.infer<typeof RepoReadySchema>;