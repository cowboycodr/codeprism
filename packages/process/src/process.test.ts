import { describe, expect, it } from 'vitest';
import { assertNoShellCommand, runProcess } from './process';

describe('process execution boundary', () => {
  it('rejects shell metacharacters instead of passing them through', () => {
    expect(() => assertNoShellCommand('git', ['status; rm -rf /'])).toThrow();
    expect(() => assertNoShellCommand('git && whoami', [])).toThrow();
  });

  it('executes argv arrays without a shell', async () => {
    const result = await runProcess('node', ['-e', 'process.stdout.write(process.argv[1])', 'ok']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('ok');
  });
});
