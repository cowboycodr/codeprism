import { apiGet } from '$lib/api';

export const load = async ({ fetch, params }) => {
  const [job, logs] = await Promise.all([
    apiGet<{ job: { id: number; status: string; command: string; commitSha: string } }>(`/api/jobs/${params.id}`, fetch),
    apiGet<{ logs: Array<{ stream: string; line: string; sequence: number }> }>(`/api/jobs/${params.id}/logs`, fetch)
  ]);

  return {
    job: job.job,
    logs: logs.logs
  };
};
