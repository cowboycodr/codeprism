import { describe, expect, it } from 'vitest';
import { parseRepoIdentifier, parseRepoPath } from './ids';

describe('repo identifiers', () => {
  it('accepts structured owner/name identifiers', () => {
    expect(parseRepoIdentifier({ owner: 'codeprism', name: 'codeprism' })).toEqual({
      owner: 'codeprism',
      name: 'codeprism'
    });
  });

  it('rejects traversal and raw path input', () => {
    expect(() => parseRepoIdentifier({ owner: '..', name: 'repo' })).toThrow();
    expect(() => parseRepoIdentifier({ owner: 'owner/path', name: 'repo' })).toThrow();
    expect(() => parseRepoPath('/owner/repo/extra.git')).toThrow();
  });

  it('parses SSH repo paths into structured identifiers', () => {
    expect(parseRepoPath('/owner/repo.git')).toEqual({ owner: 'owner', name: 'repo' });
  });
});
