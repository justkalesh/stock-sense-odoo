export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `Request failed (${status})`);
    this.status = status;
    this.code = body?.error?.code;
    this.fields = body?.error?.fields || {};
  }
}

// Same-origin JSON calls to the backend (Vite proxies /api in dev; Vercel rewrites it in production).
// Non-GET requests always send JSON: the server rejects anything else to block cross-site form posts.
export async function api(method, path, body) {
  const write = method !== "GET";
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: write ? { "Content-Type": "application/json" } : undefined,
      body: write ? JSON.stringify(body ?? {}) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, { error: { message: "Can't reach the server. Check your connection and try again." } });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
