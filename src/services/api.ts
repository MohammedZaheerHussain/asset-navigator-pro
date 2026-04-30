/**
 * Centralized API Service — SNHRC Asset Management
 *
 * All backend calls flow through this module.
 * Handles JWT token management, request/response interceptors,
 * and standardized error handling.
 */

const API_BASE = "http://localhost:8000/api";

// ─── Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error_code?: number;
  errors?: Record<string, string[]>;
  pagination?: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "staff";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ─── Token Management ───────────────────────────────────────────

const TOKEN_KEY = "snhrc_token";
const USER_KEY = "snhrc_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Keep legacy key for backward compat with existing ProtectedRoute
  localStorage.setItem("snhrc_auth", JSON.stringify({ email: user.email }));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("snhrc_auth");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ─── Core Fetch Wrapper ─────────────────────────────────────────

async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    // Handle 401 — auto-logout
    if (response.status === 401) {
      clearAuth();
      // Only redirect if we're not already on login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      throw new Error(data.message || "Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    // Network error
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      throw new Error(
        "Unable to connect to the server. Please check if the backend is running."
      );
    }
    throw error;
  }
}

// ─── Auth API ───────────────────────────────────────────────────

export async function login(
  payload: LoginPayload
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.success && response.data) {
    setAuth(response.data.token, response.data.user);
  }

  return response;
}

export async function getProfile(): Promise<ApiResponse<AuthUser>> {
  return apiFetch<AuthUser>("/auth/profile");
}

export function logout(): void {
  clearAuth();
  window.location.href = "/login";
}

// ─── Dashboard API ──────────────────────────────────────────────

export interface DashboardStats {
  total_assets: number;
  active_assets: number;
  expiring_warranties: number;
  assets_in_transfer: number;
  maintenance_assets: number;
  active_transfers: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface BranchCount {
  branch: string;
  branch_code: string;
  count: number;
}

export interface ActivityLog {
  id: number;
  asset_code: string;
  action: string;
  details: any;
  performed_by: string;
  timestamp: string;
}

export interface ExpiringWarranty {
  asset_code: string;
  name: string;
  warranty_expiry: string;
  branch_name: string;
  department_name: string;
  days_remaining: number;
}

export async function getDashboardStats(): Promise<
  ApiResponse<DashboardStats>
> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}

export async function getAssetsByCategory(): Promise<
  ApiResponse<CategoryCount[]>
> {
  return apiFetch<CategoryCount[]>("/dashboard/assets-by-category");
}

export async function getAssetsByBranch(): Promise<
  ApiResponse<BranchCount[]>
> {
  return apiFetch<BranchCount[]>("/dashboard/assets-by-branch");
}

export async function getRecentActivity(
  limit = 10
): Promise<ApiResponse<ActivityLog[]>> {
  return apiFetch<ActivityLog[]>(`/dashboard/recent-activity?limit=${limit}`);
}

export async function getExpiringWarranties(
  days = 90
): Promise<ApiResponse<ExpiringWarranty[]>> {
  return apiFetch<ExpiringWarranty[]>(
    `/dashboard/expiring-warranties?days=${days}`
  );
}

// ─── Tracking API ───────────────────────────────────────────────

export interface TrackingData {
  asset_code: string;
  name: string;
  description: string;
  category: string;
  barcode: string;
  serial_number: string;
  location: {
    branch: string;
    branch_code: string;
    department: string;
    department_code: string;
  };
  status: string;
  assigned_to: string | null;
  purchase_date: string | null;
  purchase_cost: string | null;
  warranty: {
    expiry: string | null;
    status: string;
    days_remaining: number | null;
  };
  last_updated: string;
  created_at: string;
  transfer_history: Array<{
    id: number;
    from_branch: string;
    from_department: string;
    to_branch: string;
    to_department: string;
    status: string;
    reason: string | null;
    initiated_at: string;
    completed_at: string | null;
    initiated_by: string;
  }>;
  activity_log: Array<{
    action: string;
    details: any;
    performed_by: string;
    timestamp: string;
  }>;
}

export async function trackAsset(
  type: string,
  value: string
): Promise<ApiResponse<TrackingData>> {
  return apiFetch<TrackingData>(
    `/track?type=${encodeURIComponent(type)}&value=${encodeURIComponent(value)}`
  );
}

// ─── Assets API ─────────────────────────────────────────────────

export async function getAssets(params?: Record<string, string>): Promise<ApiResponse<any[]>> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<any[]>(`/assets${query}`);
}

export async function getAsset(code: string): Promise<ApiResponse<any>> {
  return apiFetch(`/assets/${code}`);
}

export async function createAsset(data: any): Promise<ApiResponse<any>> {
  return apiFetch("/assets", { method: "POST", body: JSON.stringify(data) });
}

export async function updateAsset(
  code: string,
  data: any
): Promise<ApiResponse<any>> {
  return apiFetch(`/assets/${code}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(code: string): Promise<ApiResponse<any>> {
  return apiFetch(`/assets/${code}`, { method: "DELETE" });
}

// ─── Branches API ───────────────────────────────────────────────

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
  department_count?: number;
  created_at: string;
  updated_at: string;
}

export async function getBranches(): Promise<ApiResponse<Branch[]>> {
  return apiFetch<Branch[]>("/branches");
}

export async function createBranch(data: any): Promise<ApiResponse<Branch>> {
  return apiFetch<Branch>("/branches", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBranch(
  id: number,
  data: any
): Promise<ApiResponse<Branch>> {
  return apiFetch<Branch>(`/branches/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Departments API ────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  code: string;
  branch_id: number;
  branch_name?: string;
  head_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getDepartments(
  branchId?: number
): Promise<ApiResponse<Department[]>> {
  const query = branchId ? `?branch_id=${branchId}` : "";
  return apiFetch<Department[]>(`/departments${query}`);
}

export async function createDepartment(
  data: any
): Promise<ApiResponse<Department>> {
  return apiFetch<Department>("/departments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(
  id: number,
  data: any
): Promise<ApiResponse<Department>> {
  return apiFetch<Department>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── Categories API ─────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return apiFetch<Category[]>("/categories");
}

// ─── Transfers API ──────────────────────────────────────────────

export async function getTransfers(params?: Record<string, string>): Promise<ApiResponse<any[]>> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<any[]>(`/transfers${query}`);
}

export async function createTransfer(data: any): Promise<ApiResponse<any>> {
  return apiFetch("/transfers", { method: "POST", body: JSON.stringify(data) });
}

// ─── Health Check ───────────────────────────────────────────────

export async function healthCheck(): Promise<ApiResponse<any>> {
  return apiFetch("/health");
}
