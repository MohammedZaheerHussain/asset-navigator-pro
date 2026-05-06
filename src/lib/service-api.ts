/**
 * Shared API helpers for Service & Depreciation pages
 */
const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") + "/api";

function getToken(): string {
  try {
    const auth = JSON.parse(localStorage.getItem("snhrc_auth") || "{}");
    return auth.token || localStorage.getItem("snhrc_token") || "";
  } catch {
    return localStorage.getItem("snhrc_token") || "";
  }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}`, ...extra };
}

export async function svcGet(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function svcPost(path: string, body: any): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function svcPut(path: string, body: any): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `PUT ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function svcDelete(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
  return res.json();
}
