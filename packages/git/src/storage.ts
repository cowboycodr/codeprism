import { mkdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { config } from '@codeprism/shared/config';
import type { RepoIdentifier } from '@codeprism/shared/ids';

const reposRoot = path.join(config.dataDir, 'repos');
mkdirSync(reposRoot, { recursive: true });

export function getReposRoot() {
  return reposRoot;
}

export function getRepoPath(repo: RepoIdentifier): string {
  const repoPath = path.join(reposRoot, repo.owner, `${repo.name}.git`);
  const parent = path.dirname(repoPath);
  mkdirSync(parent, { recursive: true });

  const resolvedRoot = realpathSync(reposRoot);
  const resolvedParent = realpathSync(parent);
  const relative = path.relative(resolvedRoot, path.join(resolvedParent, path.basename(repoPath)));
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Repository path escapes storage root');
  }

  return repoPath;
}
