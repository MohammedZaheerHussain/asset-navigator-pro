/**
 * Shared API helpers for Service & Depreciation pages.
 * Matches the token/URL pattern used across the codebase.
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") + "/api";

function getToken(): string {
  return localStorage.getItem("snhrc_token") || "";
}

function headers(json = false): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${getToken()}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function handleRes(res: Response): Promise<any> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const svcGet = (path: string) =>
  fetch(`${API_BASE}${path}`, { headers: headers() }).then(handleRes);

export const svcPost = (path: string, body: any) =>
  fetch(`${API_BASE}${path}`, { method: "POST", headers: headers(true), body: JSON.stringify(body) }).then(handleRes);

export const svcPut = (path: string, body: any) =>
  fetch(`${API_BASE}${path}`, { method: "PUT", headers: headers(true), body: JSON.stringify(body) }).then(handleRes);

export const svcDelete = (path: string) =>
  fetch(`${API_BASE}${path}`, { method: "DELETE", headers: headers() }).then(handleRes);
