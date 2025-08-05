import { getToken, removeToken } from "./tokenService";

const DEFAULT_TIMEOUT = 10000; // 10 s

async function request<T>(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timer);

    if (response.status === 401) {
      // Access token invalid or expired – clear and bounce to landing
      removeToken();
      window.location.href = "/";
      throw new Error("Session expired – please log in again.");
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      // Prefer backend-provided error descriptions
      const errorMessage = body?.detail ?? body?.message ?? response.statusText;
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get:  <T>(url: string, opts?: RequestInit) => request<T>(url, { ...opts, method: "GET" }),
  post: <T>(url: string, body: unknown, opts?: RequestInit) =>
    request<T>(url, { ...opts, method: "POST", body: JSON.stringify(body) }),
  put:  <T>(url: string, body: unknown, opts?: RequestInit) =>
    request<T>(url, { ...opts, method: "PUT", body: JSON.stringify(body) }),
  del:  <T>(url: string, body:unknown, opts?: RequestInit) => request<T>(url, { ...opts, method: "DELETE", body: JSON.stringify(body) }),
};