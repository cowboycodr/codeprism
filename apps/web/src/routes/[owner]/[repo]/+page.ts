import { apiGet } from '$lib/api';

export const load = async ({ fetch, params }) => {
  const base = `/api/repos/${params.owner}/${params.repo}`;
  const [repo, refs, commits, jobs] = await Promise.all([
    apiGet<{ repository: { owner: string; name: string; defaultBranch: string; ciCommand: string } }>(base, fetch),
    apiGet<{ refs: Array<{ name: string; sha: string }> }>(`${base}/refs`, fetch),
    apiGet<{ commits: Array<{ sha: string; subject: string; authorName: string; authoredAt: string }> }>(
      `${base}/commits`,
      fetch
    ),
    apiGet<{ jobs: Array<{ id: number; commitSha: string; status: string; command: string; createdAt: string }> }>(
      `${base}/jobs`,
      fetch
    )
  ]);

  return {
    repository: repo.repository,
    refs: refs.refs,
    commits: commits.commits,
    jobs: jobs.jobs
  };
};
