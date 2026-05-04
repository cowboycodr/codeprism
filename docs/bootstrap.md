# CodePrism Bootstrap

CodePrism starts as a single-node, trusted self-hosted forge. The first target is a local Docker Compose deployment that can later move to a Raspberry Pi with the same storage layout.

## Environment

- `CODEPRISM_DATA_DIR`: root for runtime data.
- `CODEPRISM_DATABASE_URL`: SQLite database path.
- `CODEPRISM_HTTP_PORT`: API server port.
- `CODEPRISM_WEB_PORT`: frontend development server port.
- `CODEPRISM_SSH_HOST`: bind host for embedded SSH.
- `CODEPRISM_SSH_PORT`: bind port for embedded SSH.
- `CODEPRISM_RUNNER_ENABLED`: enables the local runner loop.

## Storage Layout

All repository paths are derived inside Git Core from validated structured identifiers:

```text
CODEPRISM_DATA_DIR/
  codeprism.sqlite
  repos/
    owner/
      repo.git/
  workspaces/
    job-id/
  ssh_host_rsa_key.pem
```

API, SSH, and runner callers pass `{ owner, name }`, never raw filesystem paths.

## SSH

CodePrism runs an embedded SSH server. The initial Git remote shape is:

```text
ssh://git@HOST:2222/owner/repo.git
```

Only `git-receive-pack` is supported in this first seed. Public keys are stored in SQLite through `POST /api/ssh-keys`.

## Process Execution

Git and infrastructure commands must go through typed wrappers using argv arrays. Shell interpolation is forbidden for Git, SSH routing, repository storage, and internal process execution.

CI commands are trusted-runner commands. They are parsed into argv and passed to Docker without a shell.

## Runner Trust Model

Docker jobs provide a useful reproducibility and separation boundary, but they are not a perfect sandbox for hostile code. This seed assumes a trusted single-user or small trusted-user setup.

The runner owns job claiming, checkout, Docker execution, log capture, final status, and workspace cleanup.

## Self-Hosting Path

1. Run CodePrism locally with `npm run dev` or Docker Compose.
2. Add your SSH public key through the API.
3. Create `codeprism/codeprism`.
4. Push this repository to `ssh://git@HOST:2222/codeprism/codeprism.git`.
5. Let CodePrism queue and run its own CI job.
6. Move the same Compose setup and data directory to the Raspberry Pi.

## Workspace Layout

CodePrism is a monorepo:

```text
apps/api      HTTP API process, runtime bootstrap
apps/web      SvelteKit frontend
packages/db   SQLite and Drizzle metadata
packages/git  bare repository storage and Git operations
packages/ssh  embedded SSH Git server
packages/runner Docker trusted-runner execution
packages/shared shared config and identifiers
packages/process process execution boundary
```
