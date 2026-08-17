export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }

  return data as T;
}
