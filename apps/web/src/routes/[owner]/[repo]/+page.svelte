<script lang="ts">
  import { CheckCircle2, CircleDashed, GitCommit, XCircle } from 'lucide-svelte';

  export let data: {
    repository: {
      owner: string;
      name: string;
      defaultBranch: string;
      ciCommand: string;
    };
    refs: Array<{ name: string; sha: string }>;
    commits: Array<{ sha: string; subject: string; authorName: string; authoredAt: string }>;
    jobs: Array<{ id: number; commitSha: string; status: string; command: string; createdAt: Date }>;
  };

  const statusIcon = (status: string) => {
    if (status === 'succeeded') return CheckCircle2;
    if (status === 'failed' || status === 'setup_failed') return XCircle;
    return CircleDashed;
  };
</script>

<main class="mx-auto grid max-w-6xl grid-cols-[1fr_360px] gap-6 p-6">
  <section class="min-w-0 rounded-md border border-border bg-surface">
    <div class="border-b border-border px-5 py-4">
      <h1 class="text-lg font-semibold">{data.repository.owner}/{data.repository.name}</h1>
      <p class="mt-1 text-sm text-muted-foreground">Default branch: {data.repository.defaultBranch}</p>
    </div>

    <div class="grid grid-cols-2 border-b border-border">
      <div class="border-r border-border p-4">
        <div class="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Refs</div>
        <div class="space-y-2">
          {#each data.refs as ref}
            <div class="truncate rounded border border-border px-3 py-2 font-mono text-xs">{ref.name}</div>
          {:else}
            <div class="text-sm text-muted-foreground">No refs yet.</div>
          {/each}
        </div>
      </div>

      <div class="p-4">
        <div class="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Commits</div>
        <div class="space-y-2">
          {#each data.commits as commit}
            <div class="rounded border border-border px-3 py-2">
              <div class="flex items-center gap-2 text-sm">
                <GitCommit size={14} />
                <span class="truncate">{commit.subject}</span>
              </div>
              <div class="mt-1 font-mono text-xs text-muted-foreground">{commit.sha.slice(0, 12)}</div>
            </div>
          {:else}
            <div class="text-sm text-muted-foreground">No commits yet.</div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <aside class="rounded-md border border-border bg-surface">
    <div class="border-b border-border px-4 py-3">
      <div class="text-sm font-semibold">CI Jobs</div>
      <div class="mt-1 font-mono text-xs text-muted-foreground">{data.repository.ciCommand}</div>
    </div>
    <div class="divide-y divide-border">
      {#each data.jobs as job}
        <a href="/jobs/{job.id}" class="flex items-start gap-3 px-4 py-3 hover:bg-muted">
          <svelte:component this={statusIcon(job.status)} size={16} class="mt-0.5" />
          <span class="min-w-0">
            <span class="block text-sm font-medium">{job.status}</span>
            <span class="block truncate font-mono text-xs text-muted-foreground">{job.commitSha.slice(0, 12)}</span>
          </span>
        </a>
      {:else}
        <div class="px-4 py-6 text-sm text-muted-foreground">No jobs yet.</div>
      {/each}
    </div>
  </aside>
</main>
