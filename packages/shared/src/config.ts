import { mkdirSync } from 'node:fs';
import path from 'node:path';

export type CodePrismConfig = {
  dataDir: string;
  databaseUrl: string;
  httpPort: number;
  sshHost: string;
  sshPort: number;
  runnerEnabled: boolean;
};

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return parsed;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function loadConfig(env = process.env): CodePrismConfig {
  const baseDir = env.INIT_CWD ?? process.cwd();
  const dataDir = path.resolve(baseDir, env.CODEPRISM_DATA_DIR ?? './data');
  mkdirSync(dataDir, { recursive: true });

  const databaseUrl = path.resolve(baseDir, env.CODEPRISM_DATABASE_URL ?? path.join(dataDir, 'codeprism.sqlite'));
  mkdirSync(path.dirname(databaseUrl), { recursive: true });

  return {
    dataDir,
    databaseUrl,
    httpPort: parsePort(env.CODEPRISM_HTTP_PORT, 5173),
    sshHost: env.CODEPRISM_SSH_HOST ?? '0.0.0.0',
    sshPort: parsePort(env.CODEPRISM_SSH_PORT, 2222),
    runnerEnabled: parseBool(env.CODEPRISM_RUNNER_ENABLED, true)
  };
}

export const config = loadConfig();
