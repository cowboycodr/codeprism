import { getRepository, recordPush, createQueuedJob } from '@codeprism/db/repositories';
import type { RepoIdentifier } from '@codeprism/shared/ids';

export async function handlePostReceive(repo: RepoIdentifier, updates: Array<{ oldSha: string; newSha: string; refName: string }>) {
  const repository = getRepository(repo);
  if (!repository) return;

  for (const update of updates) {
    if (/^0{40}$/.test(update.newSha)) continue;
    const push = recordPush(repository.id, update.oldSha, update.newSha, update.refName);
    createQueuedJob(repository.id, push.id, update.newSha, repository.ciCommand);
  }
}
