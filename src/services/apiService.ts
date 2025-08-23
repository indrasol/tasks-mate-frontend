import { getToken, removeToken } from "./tokenService";

const DEFAULT_TIMEOUT = 30000; // 30 s


function toHttpsIfNeeded(url: string) {
  try {
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      url.startsWith("http://") &&
      !/^(http:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\b/i.test(url)
    ) {
      return url.replace(/^http:\/\//i, "https://");
    }
  } catch {}
  return url;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const token = getToken();
  const isFormDataBody = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(!isFormDataBody ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  try {
    const safeUrl = toHttpsIfNeeded(url);
    const response = await fetch(safeUrl, { ...options, headers, signal: controller.signal });
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

    // Handle empty responses (e.g., 204 No Content) gracefully
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      // If server didn't return JSON, avoid parsing errors
      const text = await response.text();
      return (text as unknown) as T;
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get:  <T>(url: string, opts?: RequestInit) => request<T>(url, { ...opts, method: "GET" }),
  post: <T>(url: string, body: any, opts?: RequestInit) =>
    request<T>(url, {
      ...opts,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put:  <T>(url: string, body: any, opts?: RequestInit) =>
    request<T>(url, {
      ...opts,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  del:  <T>(url: string, body?: any, opts?: RequestInit) =>
    request<T>(url, {
      ...opts,
      method: "DELETE",
      body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    }),
};
