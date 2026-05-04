import { apiGet } from '$lib/api';

export const load = async ({ fetch }) => {
  return apiGet<{
    repositories: Array<{
      owner: string;
      name: string;
      defaultBranch: string;
      ciCommand: string;
    }>;
  }>('/api/repos', fetch);
};
