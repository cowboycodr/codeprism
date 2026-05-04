import { describe, expect, it } from 'vitest';
import { parseCommandLine } from './command';

describe('runner command parsing', () => {
  it('parses simple trusted-runner commands into argv arrays', () => {
    expect(parseCommandLine('npm test')).toEqual(['npm', 'test']);
  });

  it('preserves quoted arguments without invoking a shell', () => {
    expect(parseCommandLine('node -e "console.log(1)"')).toEqual(['node', '-e', 'console.log(1)']);
  });

  it('rejects empty or malformed commands', () => {
    expect(() => parseCommandLine('')).toThrow();
    expect(() => parseCommandLine('node "unterminated')).toThrow();
  });
});
