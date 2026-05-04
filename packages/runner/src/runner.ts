import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { config } from '@codeprism/shared/config';
import { getRepoPath } from '@codeprism/git/storage';
import { runProcess } from '@codeprism/process';
import { appendJobLog, listQueuedJobs, updateJobStatus } from '@codeprism/db/jobs';
import { db } from '@codeprism/db/db';
import { repositories } from '@codeprism/db/schema';
import { eq } from 'drizzle-orm';
import { parseCommandLine } from './command';

let loopStarted = false;
let running = false;

function appendLines(jobId: number, stream: 'stdout' | 'stderr' | 'system', chunk: Buffer | string) {
  const text = String(chunk);
  for (const line of text.split(/\r?\n/)) {
    if (line.length > 0) appendJobLog(jobId, stream, line);
  }
}

async function runDockerJob(job: { id: number; repositoryId: number; commitSha: string; command: string }) {
  const repository = db.select().from(repositories).where(eq(repositories.id, job.repositoryId)).get();
  if (!repository) throw new Error(`Repository ${job.repositoryId} not found`);

  const workspace = path.join(config.dataDir, 'workspaces', String(job.id));
  rmSync(workspace, { recursive: true, force: true });
  mkdirSync(workspace, { recursive: true });

  try {
    const repoPath = getRepoPath({ owner: repository.owner, name: repository.name });
    const clone = await runProcess('git', ['clone', repoPath, workspace], { timeoutMs: 120_000 });
    appendLines(job.id, 'system', clone.stdout);
    appendLines(job.id, 'system', clone.stderr);
    if (clone.exitCode !== 0) throw new Error(`git clone failed with exit code ${clone.exitCode}`);

    const checkout = await runProcess('git', ['checkout', job.commitSha], { cwd: workspace, timeoutMs: 60_000 });
    appendLines(job.id, 'system', checkout.stdout);
    appendLines(job.id, 'system', checkout.stderr);
    if (checkout.exitCode !== 0) throw new Error(`git checkout failed with exit code ${checkout.exitCode}`);

    const command = parseCommandLine(job.command);
    appendJobLog(job.id, 'system', `Docker trusted-runner command: ${command.join(' ')}`);

    const docker = spawn(
      'docker',
      ['run', '--rm', '-v', `${workspace}:/workspace`, '-w', '/workspace', 'node:22-bookworm', ...command],
      { shell: false, stdio: ['ignore', 'pipe', 'pipe'] }
    );

    docker.stdout.on('data', (chunk) => appendLines(job.id, 'stdout', chunk));
    docker.stderr.on('data', (chunk) => appendLines(job.id, 'stderr', chunk));

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      docker.on('error', reject);
      docker.on('close', resolve);
    });

    updateJobStatus(job.id, exitCode === 0 ? 'succeeded' : 'failed', { exitCode });
  } catch (error) {
    appendJobLog(job.id, 'system', String(error));
    updateJobStatus(job.id, 'setup_failed', { exitCode: null });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const [job] = listQueuedJobs();
    if (!job) return;
    updateJobStatus(job.id, 'running');
    await runDockerJob(job);
  } finally {
    running = false;
  }
}

export function startRunnerLoop() {
  if (loopStarted || !config.runnerEnabled) return;
  loopStarted = true;
  setInterval(() => {
    tick().catch((error) => console.error('Runner tick failed', error));
  }, 2_000).unref();
  tick().catch((error) => console.error('Runner initial tick failed', error));
}
