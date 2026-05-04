import { spawn } from 'node:child_process';
import ssh2, { type Connection } from 'ssh2';
import { config } from '@codeprism/shared/config';
import { parseRepoPath, repoSlug } from '@codeprism/shared/ids';
import { ensureBareRepository, listRefs } from '@codeprism/git/core';
import { getRepoPath } from '@codeprism/git/storage';
import { handlePostReceive } from '@codeprism/git/push';
import { ensureRepository } from '@codeprism/db/repositories';
import { isAuthorizedPublicKey } from './auth';
import { loadOrCreateHostKey } from './keys';

const { Server } = ssh2;
const serverKey = Symbol.for('codeprism.ssh.server');

function getGlobalServer() {
  return (globalThis as typeof globalThis & { [serverKey]?: InstanceType<typeof Server> })[serverKey];
}

function setGlobalServer(server: InstanceType<typeof Server>) {
  (globalThis as typeof globalThis & { [serverKey]?: InstanceType<typeof Server> })[serverKey] = server;
}

function parseReceivePackCommand(command: string) {
  const match = command.match(/^git-receive-pack '?(?<path>[^']+)'?$/);
  if (!match?.groups?.path) throw new Error('Only git-receive-pack is supported');
  return parseRepoPath(match.groups.path);
}

async function diffRefs(repo: ReturnType<typeof parseRepoPath>, before: Awaited<ReturnType<typeof listRefs>>) {
  const after = await listRefs(repo);
  const beforeMap = new Map(before.map((ref) => [ref.name, ref.sha]));
  return after
    .filter((ref) => beforeMap.get(ref.name) !== ref.sha)
    .map((ref) => ({
      oldSha: beforeMap.get(ref.name) ?? '0000000000000000000000000000000000000000',
      newSha: ref.sha,
      refName: ref.name
    }));
}

function setupClient(client: Connection) {
  client
    .on('authentication', (ctx) => {
      if (ctx.method !== 'publickey' || !ctx.key) {
        ctx.reject();
        return;
      }

      if (isAuthorizedPublicKey(ctx.key.algo, ctx.key.data)) {
        ctx.accept();
      } else {
        ctx.reject();
      }
    })
    .on('ready', () => {
      client.on('session', (accept) => {
        const session = accept();
        session.on('exec', async (acceptExec, rejectExec, info) => {
          let repo;
          try {
            repo = parseReceivePackCommand(info.command);
          } catch {
            rejectExec();
            return;
          }

          const channel = acceptExec();
          try {
            ensureRepository(repo);
            await ensureBareRepository(repo);
            const before = await listRefs(repo);
            const repoPath = getRepoPath(repo);
            const child = spawn('git-receive-pack', [repoPath], {
              shell: false,
              stdio: ['pipe', 'pipe', 'pipe']
            });

            channel.pipe(child.stdin);
            child.stdout.pipe(channel, { end: false });
            child.stderr.on('data', (chunk) => {
              channel.stderr.write(chunk);
            });

            child.on('close', async (code) => {
              try {
                const updates = await diffRefs(repo, before);
                await handlePostReceive(repo, updates);
              } catch (error) {
                channel.stderr.write(`CodePrism post-receive failed for ${repoSlug(repo)}: ${String(error)}\n`);
              }
              channel.exit(code ?? 0);
              channel.end();
            });
          } catch (error) {
            channel.stderr.write(`CodePrism receive-pack failed: ${String(error)}\n`);
            channel.exit(1);
            channel.end();
          }
        });
      });
    });
}

export function startSshServer() {
  const existing = getGlobalServer();
  if (existing) return existing;

  const server = new Server({ hostKeys: [loadOrCreateHostKey()] }, setupClient);
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`CodePrism SSH port ${config.sshPort} is already in use`);
      return;
    }
    console.error('CodePrism SSH server error', error);
  });
  server.listen(config.sshPort, config.sshHost, () => {
    console.log(`CodePrism SSH listening on ${config.sshHost}:${config.sshPort}`);
  });
  setGlobalServer(server);
  return server;
}
