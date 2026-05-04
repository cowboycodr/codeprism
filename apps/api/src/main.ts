import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { z, ZodError } from 'zod';
import { config } from '@codeprism/shared/config';
import { parseRepoIdentifier } from '@codeprism/shared/ids';
import { runMigrations } from '@codeprism/db/db';
import { getJob, listJobLogs } from '@codeprism/db/jobs';
import { createRepository, getRepository, listRepositories, listRepositoryJobs } from '@codeprism/db/repositories';
import { ensureBareRepository, getDiff, listCommits, listRefs } from '@codeprism/git/core';
import { startRunnerLoop } from '@codeprism/runner/runner';
import { createAuthorizedKey, listAuthorizedKeys } from '@codeprism/ssh/auth';
import { startSshServer } from '@codeprism/ssh/server';

const createRepoSchema = z.object({
  owner: z.string(),
  name: z.string(),
  defaultBranch: z.string().min(1).default('main'),
  ciCommand: z.string().min(1).default('npm test')
});

const createKeySchema = z.object({
  label: z.string().min(1),
  publicKey: z.string().min(1)
});

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  response.end(JSON.stringify(body));
}

function sendError(response: ServerResponse, error: unknown, status = 400) {
  if (error instanceof ZodError) {
    sendJson(response, status, { error: 'Validation failed', issues: error.issues });
    return;
  }
  sendJson(response, status, { error: error instanceof Error ? error.message : String(error) });
}

async function readJson(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function matchRepo(pathname: string, suffix = '') {
  const pattern = new RegExp(`^/api/repos/([^/]+)/([^/]+)${suffix}$`);
  const match = pathname.match(pattern);
  if (!match) return undefined;
  return parseRepoIdentifier({ owner: match[1], name: match[2] });
}

async function route(request: IncomingMessage, response: ServerResponse) {
  if (!request.url || !request.method) return sendJson(response, 400, { error: 'Invalid request' });
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});

  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
  const { pathname } = url;

  try {
    if (request.method === 'GET' && pathname === '/api/repos') {
      return sendJson(response, 200, { repositories: listRepositories() });
    }

    if (request.method === 'POST' && pathname === '/api/repos') {
      const body = createRepoSchema.parse(await readJson(request));
      const repo = parseRepoIdentifier({ owner: body.owner, name: body.name });
      const created = createRepository({
        owner: repo.owner,
        name: repo.name,
        defaultBranch: body.defaultBranch,
        ciCommand: body.ciCommand
      });
      await ensureBareRepository(repo);
      return sendJson(response, 201, { repository: created });
    }

    const repo = matchRepo(pathname);
    if (request.method === 'GET' && repo) {
      const repository = getRepository(repo);
      return repository ? sendJson(response, 200, { repository }) : sendJson(response, 404, { error: 'Repository not found' });
    }

    const refsRepo = matchRepo(pathname, '/refs');
    if (request.method === 'GET' && refsRepo) return sendJson(response, 200, { refs: await listRefs(refsRepo) });

    const commitsRepo = matchRepo(pathname, '/commits');
    if (request.method === 'GET' && commitsRepo) {
      return sendJson(response, 200, { commits: await listCommits(commitsRepo, url.searchParams.get('ref') ?? 'HEAD') });
    }

    const diffRepo = matchRepo(pathname, '/diff');
    if (request.method === 'GET' && diffRepo) {
      const base = url.searchParams.get('base');
      const head = url.searchParams.get('head');
      if (!base || !head) return sendJson(response, 400, { error: 'base and head are required' });
      return sendJson(response, 200, { diff: await getDiff(diffRepo, base, head) });
    }

    const jobsRepo = matchRepo(pathname, '/jobs');
    if (request.method === 'GET' && jobsRepo) {
      const repository = getRepository(jobsRepo);
      if (!repository) return sendJson(response, 404, { error: 'Repository not found' });
      return sendJson(response, 200, { jobs: listRepositoryJobs(repository.id) });
    }

    const jobMatch = pathname.match(/^\/api\/jobs\/(\d+)$/);
    if (request.method === 'GET' && jobMatch) {
      const job = getJob(Number(jobMatch[1]));
      return job ? sendJson(response, 200, { job }) : sendJson(response, 404, { error: 'Job not found' });
    }

    const logsMatch = pathname.match(/^\/api\/jobs\/(\d+)\/logs$/);
    if (request.method === 'GET' && logsMatch) return sendJson(response, 200, { logs: listJobLogs(Number(logsMatch[1])) });

    if (request.method === 'GET' && pathname === '/api/ssh-keys') return sendJson(response, 200, { keys: listAuthorizedKeys() });

    if (request.method === 'POST' && pathname === '/api/ssh-keys') {
      const body = createKeySchema.parse(await readJson(request));
      return sendJson(response, 201, { key: createAuthorizedKey(body.label, body.publicKey) });
    }

    return sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    return sendError(response, error);
  }
}

const migrationsPath = fileURLToPath(new URL('../../../drizzle', import.meta.url));
runMigrations(migrationsPath);
startSshServer();
if (config.runnerEnabled) startRunnerLoop();

const server = createServer((request, response) => {
  route(request, response).catch((error) => sendError(response, error, 500));
});

server.listen(config.httpPort, () => {
  console.log(`CodePrism API listening on http://localhost:${config.httpPort}`);
});
