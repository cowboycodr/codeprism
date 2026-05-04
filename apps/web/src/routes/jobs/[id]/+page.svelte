<script lang="ts">
  export let data: {
    job: { id: number; status: string; command: string; commitSha: string };
    logs: Array<{ stream: string; line: string; sequence: number }>;
  };
</script>

<main class="mx-auto max-w-5xl p-6">
  <section class="rounded-md border border-border bg-surface">
    <div class="border-b border-border px-5 py-4">
      <h1 class="text-lg font-semibold">Job #{data.job.id}</h1>
      <p class="mt-1 font-mono text-xs text-muted-foreground">{data.job.commitSha}</p>
    </div>
    <div class="grid grid-cols-3 border-b border-border text-sm">
      <div class="border-r border-border p-4">
        <div class="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
        <div class="mt-1 font-medium">{data.job.status}</div>
      </div>
      <div class="col-span-2 p-4">
        <div class="text-xs uppercase tracking-wide text-muted-foreground">Command</div>
        <div class="mt-1 font-mono text-xs">{data.job.command}</div>
      </div>
    </div>
    <pre class="max-h-[640px] overflow-auto bg-[hsl(220_14%_8%)] p-4 font-mono text-xs leading-5 text-[hsl(220_14%_92%)]">{#each data.logs as log}<span class={log.stream === 'stderr' ? 'text-red-300' : log.stream === 'system' ? 'text-blue-300' : ''}>[{log.stream}] {log.line}</span>
{/each}</pre>
  </section>
</main>
