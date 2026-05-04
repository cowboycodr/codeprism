import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { jobLogs, jobs } from './schema';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'setup_failed';

export function getJob(id: number) {
  return db.select().from(jobs).where(eq(jobs.id, id)).get();
}

export function listQueuedJobs() {
  return db.select().from(jobs).where(eq(jobs.status, 'queued')).orderBy(asc(jobs.createdAt)).all();
}

export function updateJobStatus(id: number, status: JobStatus, values: Partial<{ exitCode: number | null }> = {}) {
  const now = new Date();
  const patch: Partial<typeof jobs.$inferInsert> = { status };
  if (status === 'running') patch.startedAt = now;
  if (['succeeded', 'failed', 'canceled', 'setup_failed'].includes(status)) patch.finishedAt = now;
  if ('exitCode' in values) patch.exitCode = values.exitCode;
  return db.update(jobs).set(patch).where(eq(jobs.id, id)).returning().get();
}

export function appendJobLog(jobId: number, stream: 'stdout' | 'stderr' | 'system', line: string) {
  const last = db
    .select({ sequence: jobLogs.sequence })
    .from(jobLogs)
    .where(eq(jobLogs.jobId, jobId))
    .orderBy(asc(jobLogs.sequence))
    .all()
    .at(-1);
  const sequence = (last?.sequence ?? 0) + 1;
  return db.insert(jobLogs).values({ jobId, stream, line, sequence }).returning().get();
}

export function listJobLogs(jobId: number) {
  return db.select().from(jobLogs).where(eq(jobLogs.jobId, jobId)).orderBy(asc(jobLogs.sequence)).all();
}
