import { existsSync } from 'node:fs';
import type { RepoIdentifier } from '@codeprism/shared/ids';
import { runProcess } from '@codeprism/process';
import { getRepoPath } from './storage';

export type GitCommit = {
  sha: string;
  parents: string[];
  authorName: string;
  authorEmail: string;
  authoredAt: string;
  subject: string;
};

export async function ensureBareRepository(repo: RepoIdentifier) {
  const repoPath = getRepoPath(repo);
  if (existsSync(repoPath)) return repoPath;

  const result = await runProcess('git', ['init', '--bare', repoPath], { timeoutMs: 30_000 });
  if (result.exitCode !== 0) {
    throw new Error(`git init failed: ${result.stderr || result.stdout}`);
  }
  return repoPath;
}

export async function listRefs(repo: RepoIdentifier) {
  const repoPath = getRepoPath(repo);
  const result = await runProcess('git', ['--git-dir', repoPath, 'for-each-ref', '--format=%(refname)%00%(objectname)'], {
    timeoutMs: 30_000
  });
  if (result.exitCode !== 0) throw new Error(`git for-each-ref failed: ${result.stderr}`);
  return result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [name, sha] = line.split('\0');
      return { name, sha };
    });
}

export async function listCommits(repo: RepoIdentifier, ref = 'HEAD', limit = 50): Promise<GitCommit[]> {
  const repoPath = getRepoPath(repo);
  const format = '%H%x00%P%x00%an%x00%ae%x00%aI%x00%s';
  const result = await runProcess('git', ['--git-dir', repoPath, 'log', `--max-count=${limit}`, `--format=${format}`, ref], {
    timeoutMs: 30_000
  });
  if (result.exitCode !== 0) {
    if (result.stderr.includes('does not have any commits yet') || result.stderr.includes('unknown revision')) return [];
    throw new Error(`git log failed: ${result.stderr}`);
  }
  return result.stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, parents, authorName, authorEmail, authoredAt, subject] = line.split('\0');
      return {
        sha,
        parents: parents ? parents.split(' ').filter(Boolean) : [],
        authorName,
        authorEmail,
        authoredAt,
        subject
      };
    });
}

export async function getDiff(repo: RepoIdentifier, base: string, head: string) {
  const repoPath = getRepoPath(repo);
  const result = await runProcess('git', ['--git-dir', repoPath, 'diff', '--patch', `${base}..${head}`], {
    timeoutMs: 30_000
  });
  if (result.exitCode !== 0) throw new Error(`git diff failed: ${result.stderr}`);
  return result.stdout;
}

export async function listTree(repo: RepoIdentifier, ref = 'HEAD') {
  const repoPath = getRepoPath(repo);
  const result = await runProcess('git', ['--git-dir', repoPath, 'ls-tree', '-z', '-r', ref], { timeoutMs: 30_000 });
  if (result.exitCode !== 0) return [];
  return result.stdout
    .split('\0')
    .filter(Boolean)
    .map((entry) => {
      const [meta, filePath] = entry.split('\t');
      const [mode, type, sha] = meta.split(' ');
      return { mode, type, sha, path: filePath };
    });
}

export async function readBlob(repo: RepoIdentifier, ref: string, filePath: string) {
  if (filePath.includes('..') || filePath.startsWith('/')) throw new Error('Invalid file path');
  const repoPath = getRepoPath(repo);
  const result = await runProcess('git', ['--git-dir', repoPath, 'show', `${ref}:${filePath}`], { timeoutMs: 30_000 });
  if (result.exitCode !== 0) throw new Error(`git show failed: ${result.stderr}`);
  return result.stdout;
}
