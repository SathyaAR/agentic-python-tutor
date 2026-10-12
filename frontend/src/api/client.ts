import { ApiError } from './errors';
import { mockRequest } from './mock/server';

export { ApiError };

const BASE_URL: string | undefined = import.meta.env.VITE_API_BASE_URL;
const MOCK_FLAG: string | undefined = import.meta.env.VITE_USE_MOCK_API;

// Mock mode: explicit flag wins; otherwise fall back to mock when no backend is configured.
export const USE_MOCK_API = MOCK_FLAG ? MOCK_FLAG === 'true' : !BASE_URL;

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** AuthContext registers this so any 401 logs the user out (frontend-spec.md §8). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Method = 'GET' | 'POST';

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  try {
    if (USE_MOCK_API) {
      return await mockRequest<T>(method, path, body, authToken);
    }
    return await httpRequest<T>(method, path, body);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && authToken && onUnauthorized) {
      onUnauthorized();
    }
    throw err;
  }
}

async function httpRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.detail ?? res.statusText);
  }
  return data as T;
}

/** Human-readable message for any thrown error, including 422 detail arrays. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (Array.isArray(err.detail)) {
      return err.detail.map((d: { msg?: string }) => d.msg ?? 'Invalid input').join('; ');
    }
    if (err.status === 503) return 'The AI agent is temporarily unavailable — please retry.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
