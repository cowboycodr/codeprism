const apiBase = import.meta.env.VITE_CODEPRISM_API_URL ?? 'http://localhost:5182';

export async function apiGet<T>(path: string, fetcher: typeof fetch = fetch): Promise<T> {
  const response = await fetcher(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
