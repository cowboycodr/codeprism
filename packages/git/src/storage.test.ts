import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { getRepoPath, getReposRoot } from './storage';

describe('repository storage', () => {
  it('derives paths under the repository root', () => {
    const repoPath = getRepoPath({ owner: 'codeprism', name: 'codeprism' });
    const relative = path.relative(getReposRoot(), repoPath);
    expect(relative.startsWith('..')).toBe(false);
    expect(path.isAbsolute(relative)).toBe(false);
    expect(repoPath.endsWith(path.join('codeprism', 'codeprism.git'))).toBe(true);
  });
});
