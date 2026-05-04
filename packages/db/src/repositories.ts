import { and, desc, eq } from 'drizzle-orm';
import { db } from './db';
import { jobs, pushes, repositories, type NewRepository } from './schema';
import type { RepoIdentifier } from '@codeprism/shared/ids';

export function listRepositories() {
  return db.select().from(repositories).orderBy(repositories.owner, repositories.name).all();
}

export function getRepository(repo: RepoIdentifier) {
  return db
    .select()
    .from(repositories)
    .where(and(eq(repositories.owner, repo.owner), eq(repositories.name, repo.name)))
    .get();
}

export function createRepository(values: NewRepository) {
  return db.insert(repositories).values(values).returning().get();
}

export function ensureRepository(repo: RepoIdentifier, ciCommand = 'npm test') {
  const existing = getRepository(repo);
  if (existing) return existing;
  return createRepository({ owner: repo.owner, name: repo.name, ciCommand });
}

export function recordPush(repositoryId: number, oldSha: string, newSha: string, refName: string) {
  return db.insert(pushes).values({ repositoryId, oldSha, newSha, refName }).returning().get();
}

export function createQueuedJob(repositoryId: number, pushId: number | null, commitSha: string, command: string) {
  return db.insert(jobs).values({ repositoryId, pushId, commitSha, command }).returning().get();
}

export function listRepositoryJobs(repositoryId: number) {
  return db.select().from(jobs).where(eq(jobs.repositoryId, repositoryId)).orderBy(desc(jobs.createdAt)).all();
}
