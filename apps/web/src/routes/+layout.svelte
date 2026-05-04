<script lang="ts">
  import '../app.css';
  import { GitBranch, TerminalSquare } from 'lucide-svelte';
</script>

<div class="min-h-screen bg-background text-foreground">
  <header class="flex h-14 items-center justify-between border-b border-border bg-surface px-5">
    <a href="/" class="flex items-center gap-2 text-sm font-semibold">
      <GitBranch size={18} />
      CodePrism
    </a>
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <TerminalSquare size={15} />
      Backend seed
    </div>
  </header>
  <slot />
</div>
