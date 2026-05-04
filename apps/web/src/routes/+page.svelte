<script lang="ts">
  import { ArrowRight, CircleCheck, GitBranch } from 'lucide-svelte';

  export let data: {
    repositories: Array<{
      owner: string;
      name: string;
      defaultBranch: string;
      ciCommand: string;
    }>;
  };
</script>

<main class="mx-auto grid max-w-6xl grid-cols-[280px_1fr] gap-6 p-6">
  <aside class="rounded-md border border-border bg-surface">
    <div class="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Repositories
    </div>
    <div class="divide-y divide-border">
      {#each data.repositories as repo}
        <a class="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted" href="/{repo.owner}/{repo.name}">
          <span class="flex items-center gap-2">
            <GitBranch size={15} />
            {repo.owner}/{repo.name}
          </span>
          <ArrowRight size={14} />
        </a>
      {:else}
        <div class="px-4 py-6 text-sm text-muted-foreground">No repositories yet.</div>
      {/each}
    </div>
  </aside>

  <section class="rounded-md border border-border bg-surface p-5">
    <div class="mb-4 flex items-center gap-2 text-sm font-semibold">
      <CircleCheck size={17} class="text-success" />
      First loop target
    </div>
    <div class="grid gap-3 text-sm text-muted-foreground">
      <p>Accept an SSH push, record metadata, queue Docker CI, and inspect results here.</p>
      <code class="rounded border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground">
        ssh://git@HOST:2222/owner/repo.git
      </code>
    </div>
  </section>
</main>
