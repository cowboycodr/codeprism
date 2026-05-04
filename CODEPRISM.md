# CodePrism

![CodePrism banner](https://raw.githubusercontent.com/cowboycodr/codeprism/main/assets/codeprism.png)

CodePrism is an open-source, self-hosted code forge for people who want ownership of their code infrastructure without accepting a slow or cluttered developer experience.

The goal is not to clone GitHub feature-for-feature. The goal is to build a focused, composable, low-latency system for hosting code, reviewing changes, and running local CI on hardware you control.

## Vision

CodePrism should feel like a modern code control plane:

- Fast enough to feel local.
- Simple enough to run on a Raspberry Pi.
- Composable enough to build tools on top of it.
- Polished enough that the UI feels intentional, not homemade.
- Open source from the beginning.

The product should make one workflow feel excellent before it tries to do everything:

```text
Open repo -> inspect code -> review diff -> see CI result
```

## Product Principles

### Own the Infrastructure

CodePrism should run well on personal hardware. A developer should be able to host their repositories, metadata, and CI locally without relying on a large centralized platform.

The first deployment target is a single small server, such as a Raspberry Pi with an external SSD. Larger setups can come later.

### Keep the UI Flawless

The interface is a core product primitive, not a skin over the backend.

CodePrism should feel dense, calm, and precise. It should avoid landing-page energy, decorative dashboards, vague labels, giant cards, and explainer-heavy screens. The app should open directly into useful work.

The benchmark is not "does it have the feature?" The benchmark is "does this feel excellent to use repeatedly?"

### Build a Composable API

CodePrism should expose a low-latency API over Git primitives and product primitives.

Git primitives:

- Repositories
- Refs
- Commits
- Trees
- Blobs
- Diffs

Product primitives:

- Changes
- Reviews
- Comments
- Checks
- Jobs
- Logs

The API should make it easy to build first-party UI, local automation, command-line tools, and eventually third-party integrations.

### Start Small, Stay Real

The project should avoid pretending to be GitHub on day one. A narrow, working forge is more valuable than a broad mockup.

The first version should prove the hard loop:

```text
git push -> CodePrism receives commit -> CI runs locally -> result appears in the UI
```

## Initial Scope

CodePrism 0.1 should include:

- Create or import a bare Git repository.
- Push code to the repository.
- Browse files by branch or commit.
- View commit history.
- View clean, fast diffs.
- Configure a simple CI command per repository.
- Run CI on push.
- Stream CI logs into the browser.
- Show commit/check status in the UI.

This is enough to become useful for one developer on one machine.

## Non-Goals for the First Version

The first version should not attempt:

- GitHub-scale social features.
- Marketplace-style actions.
- Enterprise permissions.
- Complex organization billing.
- Full issue tracking.
- Full pull request parity.
- Multi-node distributed storage.
- Public SaaS hosting.

Those may become interesting later, but they are distractions before the core loop works beautifully.

## Technical Direction

The preferred early stack:

- SvelteKit for the application.
- shadcn-svelte for UI components.
- Tailwind for styling.
- SQLite for metadata.
- Bare Git repositories on the local filesystem.
- Local Git execution at first, with room to move Git-heavy work into Go or Rust later.
- Server-sent events or WebSockets for live CI logs.
- Docker Compose for deployment.

The architecture should keep three layers distinct:

```text
Git Core
  repos, refs, commits, trees, blobs, diffs

Product API
  projects, changes, comments, checks, jobs

Interface
  repo browser, diff viewer, CI logs, review surface
```

## Design Direction

CodePrism should feel closer to Linear, Raycast, and Cursor than to a traditional admin dashboard.

Core surfaces:

- Repository switcher
- Branch/ref selector
- File tree
- File viewer
- Commit list
- Diff viewer
- CI run list
- Live CI log view
- Command palette

Visual rules:

- Neutral, restrained palette.
- Subtle borders instead of heavy shadows.
- Stable pane layouts.
- Excellent typography.
- Fast keyboard navigation.
- No decorative gradients or filler illustrations.
- No explanatory text where direct interaction would be better.

The diff viewer and CI log viewer are signature surfaces. They should be treated as product-defining details.

## Long-Term Direction

If the core loop works, CodePrism can grow into:

- Change requests and review comments.
- Multi-user collaboration.
- SSH and HTTPS Git hosting.
- Repo search.
- Code search.
- Webhooks.
- CLI tooling.
- API tokens.
- Runner pools.
- Portable backups.
- Federation or mirroring.
- More advanced CI workflows.

Growth should happen by deepening the core experience, not by copying GitHub's surface area.

## One-Sentence Summary

CodePrism is a fast, open-source, self-hosted forge for code review and local CI, designed to feel flawless on one small server before it tries to scale.
