import { z } from 'zod';

const identifier = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/);

export const repoIdentifierSchema = z.object({
  owner: identifier,
  name: identifier
});

export type RepoIdentifier = z.infer<typeof repoIdentifierSchema>;

export function parseRepoIdentifier(input: unknown): RepoIdentifier {
  return repoIdentifierSchema.parse(input);
}

export function parseRepoPath(pathname: string): RepoIdentifier {
  const normalized = pathname.replace(/^\/+/, '').replace(/\.git$/, '');
  const parts = normalized.split('/');
  if (parts.length !== 2) {
    throw new Error('Repository path must be owner/repo.git');
  }
  return parseRepoIdentifier({ owner: parts[0], name: parts[1] });
}

export function repoSlug(repo: RepoIdentifier): string {
  return `${repo.owner}/${repo.name}`;
}
