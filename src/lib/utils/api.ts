/**
 * Generic API client for making HTTP requests
 * @template T The expected response type
 * @param endpoint The API endpoint (e.g., "/api/services")
 * @param options Fetch options
 * @returns Promise with the parsed JSON response
 */
export async function fetchApi<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      typeof errorData === "object" && errorData !== null && "error" in errorData
        ? String(errorData.error)
        : `HTTP ${response.status}: ${response.statusText}`;
    const error = new Error(message);
    (error as any).status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}

