import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { RepoReadySchema, type RepoReadyConfig } from './schema.js';

  export function loadConfig(configPath: string): RepoReadyConfig {
    const absolutePath = resolve(configPath);

    let raw: string;
    try {
      raw = readFileSync(absolutePath, 'utf-8');
    } catch {
      console.error(`Error: Could not find config file at ${absolutePath}`);
      process.exit(2);
    }

    const parsed = parse(raw);

    const result = RepoReadySchema.safeParse(parsed);

    if (!result.success) {
      console.error('RepoReady config error in repoready.yml:\n');
      for (const issue of result.error.issues) {
        console.error(`  ${issue.path.join('.')} — ${issue.message}`);
      }
      console.error('\nFix these errors and run repoready scan again.');
      process.exit(2);
    }

    return result.data;
  }