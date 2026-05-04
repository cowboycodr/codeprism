import { spawn } from 'node:child_process';

export type ProcessResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
};

export type ProcessOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  input?: NodeJS.ReadableStream | Buffer | string;
};

export function assertNoShellCommand(command: string, args: readonly string[]): void {
  if (command.includes(' ') || command.includes('/') && command.endsWith(' ')) {
    throw new Error('Process command must be an executable name or absolute executable path, not a shell command');
  }

  const suspicious = /[;&|`$<>]/;
  if (suspicious.test(command) || args.some((arg) => suspicious.test(arg))) {
    throw new Error('Refusing shell metacharacters in process arguments');
  }
}

export function runProcess(command: string, args: readonly string[], options: ProcessOptions = {}): Promise<ProcessResult> {
  assertNoShellCommand(command, args);

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let settled = false;
    let stdout = '';
    let stderr = '';

    const timer = options.timeoutMs
      ? setTimeout(() => {
          child.kill('SIGTERM');
        }, options.timeoutMs)
      : undefined;

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      reject(error);
    });

    child.on('close', (exitCode, signal) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, exitCode, signal });
    });

    if (options.input) {
      if (typeof options.input === 'string' || Buffer.isBuffer(options.input)) {
        child.stdin.end(options.input);
      } else {
        options.input.pipe(child.stdin);
      }
    } else {
      child.stdin.end();
    }
  });
}
