/**
 * RTK Query API Slice — SNHRC Asset Management
 *
 * Single source of truth for all API calls.
 * Replaces manual fetch calls with cached, auto-refetching queries.
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") + "/api";

// ─── Types ──────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
}

// Auth
export interface LoginPayload { username: string; password: string }
export interface AuthUser { id: number; username: string; email: string; full_name: string; role: "admin" | "staff"; phone?: string | null; last_login?: string | null }
export interface LoginData { token: string; user: AuthUser }

// Dashboard
export interface DashboardStats {
  total_assets: number; active_assets: number; expiring_warranties: number;
  assets_in_transfer: number; maintenance_assets: number; active_transfers: number;
}
export interface CategoryCount { category: string; count: number }
export interface BranchCount { branch: string; branch_code: string; count: number }
export interface ActivityLog { id: number; asset_code: string; action: string; details: any; performed_by: string; timestamp: string }
export interface ExpiringWarranty { asset_code: string; name: string; warranty_expiry: string; branch_name: string; department_name: string; days_remaining: number }

// Tracking
export interface TrackingData {
  asset_code: string; name: string; description: string; category: string;
  barcode: string; serial_number: string;
  location: { branch: string; branch_code: string; department: string; department_code: string };
  status: string; assigned_to: string | null;
  purchase_date: string | null; purchase_cost: string | null;
  warranty: { expiry: string | null; status: string; days_remaining: number | null };
  last_updated: string; created_at: string;
  transfer_history: TransferHistoryItem[];
  activity_log: ActivityItem[];
}
export interface TransferHistoryItem {
  id: number; from_branch: string; from_department: string; to_branch: string; to_department: string;
  status: string; reason: string | null; initiated_by: string; completed_by: string | null;
  initiated_at: string; completed_at: string | null;
}
export interface ActivityItem { action: string; details: any; performed_by: string; timestamp: string }

// Branch / Department / Category
export interface Branch {
  id: number; name: string; code: string; address: string; city: string; state: string;
  contact_phone: string; contact_email: string; is_active: boolean;
  department_count?: number; created_at: string; updated_at: string;
}
export interface Department {
  id: number; name: string; code: string; branch_id: number; branch_name?: string;
  head_name: string | null; is_active: boolean; created_at: string; updated_at: string;
}
export interface Category { id: number; name: string; description: string | null; is_active: boolean }

// Assets
export interface AssetRow {
  asset_code: string; name: string; description: string; category_name: string;
  barcode: string; serial_number: string; branch_name: string; branch_code: string;
  department_name: string; department_code: string; status: string; assigned_to: string | null;
  purchase_date: string | null; purchase_cost: string | null;
  warranty_expiry: string | null; created_at: string; updated_at: string;
}
export interface AssetFilters { status?: string; category_id?: string; branch_id?: string; department_id?: string; search?: string; page?: number; per_page?: number }

// Transfers
export interface TransferRow {
  id: number; asset_code: string; asset_name: string;
  from_branch_name: string; from_department_name: string;
  to_branch_name: string; to_department_name: string;
  status: string; reason: string | null;
  initiated_by_name: string; completed_by_name: string | null;
  initiated_at: string; completed_at: string | null;
}
export interface TransferPayload {
  asset_code: string; to_branch_id: number; to_department_id: number; reason?: string;
}

// Users
export interface UserRow {
  id: number; username: string; email: string; full_name: string;
  phone: string | null; role: "admin" | "staff"; is_active: boolean;
  last_login: string | null; created_at: string; updated_at: string;
}
export interface CreateUserPayload { username: string; email: string; password: string; full_name: string; role: "admin" | "staff"; phone?: string }
export interface UpdateUserPayload { username?: string; email?: string; password?: string; full_name?: string; role: "admin" | "staff"; phone?: string }

// Procurement
export interface SupplierRow {
  id: number; supplier_code: string; supplier_name: string; dealer_name: string | null;
  supplier_type: string; contact_person: string | null; phone: string | null; alternate_phone: string | null;
  email: string | null; address_line1: string | null; city: string | null; state: string | null;
  pincode: string | null; gst_number: string | null; pan_number: string | null;
  payment_terms: string | null; is_preferred: boolean; is_active: boolean; remarks: string | null;
  total_purchases?: number; total_spend?: number; last_purchase_date?: string | null;
}
export interface SupplierStats { total: number; active: number; preferred: number }
export interface PurchaseRow {
  id: number; purchase_code: string; supplier_id: number; invoice_number: string | null;
  invoice_date: string | null; purchase_date: string; receiving_branch_id: number;
  receiving_department_id: number | null; subtotal: number; gst_amount: number;
  discount_amount: number; grand_total: number; auto_generate_assets: boolean;
  status: string; approved_by: number | null; approved_at: string | null;
  purchase_notes: string | null; supplier_name?: string; branch_name?: string;
  created_by_name?: string; approved_by_name?: string; item_count?: number;
  invoice_count?: number; assets_generated?: number;
  items?: PurchaseItemRow[]; invoices?: PurchaseInvoiceRow[];
  generated_assets?: { asset_code: string; name: string }[];
  timeline?: { event: string; date: string | null; by?: string; done: boolean }[];
}
export interface PurchaseItemRow {
  id: number; item_name: string; category_id: number | null; category_name?: string;
  quantity: number; unit_price: number; warranty_months: number; serial_prefix: string | null;
  total_price: number; notes: string | null;
}
export interface PurchaseInvoiceRow {
  id: number; purchase_id: number; file_name: string; file_path: string;
  file_type: string | null; file_size: number | null;
  uploaded_by_name?: string; uploaded_at: string;
  purchase_code?: string; invoice_number?: string; grand_total?: number; supplier_name?: string;
}
export interface PurchaseStats { total: number; pending: number; total_spend: number; month_spend: number }
export interface CreatePurchasePayload {
  supplier_id: number; purchase_date: string; receiving_branch_id: number;
  receiving_department_id?: number; invoice_number?: string; invoice_date?: string;
  gst_amount?: number; discount_amount?: number; purchase_notes?: string;
  auto_generate_assets?: boolean; status?: string;
  items: { item_name: string; category_id?: number; quantity: number; unit_price: number; warranty_months?: number; serial_prefix?: string; notes?: string }[];
}

// ─── Token Helpers ──────────────────────────────────────────────

export function getToken(): string | null { return localStorage.getItem("snhrc_token"); }
export function getUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem("snhrc_user") || "null"); } catch { return null; }
}
export function setAuth(token: string, user: AuthUser) {
  localStorage.setItem("snhrc_token", token);
  localStorage.setItem("snhrc_user", JSON.stringify(user));
  localStorage.setItem("snhrc_auth", JSON.stringify({ email: user.email }));
}
export function clearAuth() {
  localStorage.removeItem("snhrc_token");
  localStorage.removeItem("snhrc_user");
  localStorage.removeItem("snhrc_auth");
}
export function isAuthenticated(): boolean { return !!getToken(); }
export function logout() { clearAuth(); window.location.href = "/login"; }

// ─── RTK Query API ──────────────────────────────────────────────

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    return headers;
  },
});

// Auto-redirect to login on 401 (expired token)
const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    // Don't redirect if we're already on the login page or this IS the login call
    const isLoginCall = typeof args === 'string' ? args.includes('/auth/login') : args.url?.includes('/auth/login');
    if (!isLoginCall && window.location.pathname !== '/login') {
      clearAuth();
      window.location.href = '/login';
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Assets", "Branches", "Departments", "Categories", "Transfers", "Dashboard", "Users"],

  endpoints: (build) => ({
    // ── Auth ──
    login: build.mutation<ApiResponse<LoginData>, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Dashboard"],
    }),
    getProfile: build.query<ApiResponse<AuthUser>, void>({
      query: () => "/auth/profile",
    }),
    updateProfile: build.mutation<ApiResponse<AuthUser>, { full_name?: string; email?: string; phone?: string }>({
      query: (body) => ({ url: "/auth/profile", method: "PUT", body }),
    }),
    changePassword: build.mutation<ApiResponse<null>, { current_password: string; new_password: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),

    // ── Dashboard ──
    getDashboardStats: build.query<ApiResponse<DashboardStats>, void>({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard"],
    }),
    getAssetsByCategory: build.query<ApiResponse<CategoryCount[]>, void>({
      query: () => "/dashboard/assets-by-category",
      providesTags: ["Dashboard"],
    }),
    getAssetsByBranch: build.query<ApiResponse<BranchCount[]>, void>({
      query: () => "/dashboard/assets-by-branch",
      providesTags: ["Dashboard"],
    }),
    getRecentActivity: build.query<ApiResponse<ActivityLog[]>, number | void>({
      query: (limit = 10) => `/dashboard/recent-activity?limit=${limit}`,
      providesTags: ["Dashboard"],
    }),
    getExpiringWarranties: build.query<ApiResponse<ExpiringWarranty[]>, number | void>({
      query: (days = 90) => `/dashboard/expiring-warranties?days=${days}`,
      providesTags: ["Dashboard"],
    }),

    // ── Smart Tracking ──
    trackAsset: build.query<ApiResponse<TrackingData>, string>({
      query: (value) => `/track?value=${encodeURIComponent(value)}`,
    }),

    // ── Assets (paginated) ──
    getAssets: build.query<ApiResponse<AssetRow[]>, AssetFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== "" && v !== "all") params.set(k, String(v));
          });
        }
        return `/assets?${params.toString()}`;
      },
      providesTags: ["Assets"],
    }),
    getAsset: build.query<ApiResponse<any>, string>({
      query: (code) => `/assets/${code}`,
      providesTags: (_r, _e, code) => [{ type: "Assets", id: code }],
    }),
    createAsset: build.mutation<ApiResponse<any>, any>({
      query: (body) => ({ url: "/assets", method: "POST", body }),
      invalidatesTags: ["Assets", "Dashboard"],
    }),
    updateAsset: build.mutation<ApiResponse<any>, { code: string; data: any }>({
      query: ({ code, data }) => ({ url: `/assets/${code}`, method: "PUT", body: data }),
      invalidatesTags: ["Assets", "Dashboard"],
    }),
    deleteAsset: build.mutation<ApiResponse<any>, string>({
      query: (code) => ({ url: `/assets/${code}`, method: "DELETE" }),
      invalidatesTags: ["Assets", "Dashboard"],
    }),

    // ── Branches ──
    getBranches: build.query<ApiResponse<Branch[]>, void>({
      query: () => "/branches",
      providesTags: ["Branches"],
    }),
    createBranch: build.mutation<ApiResponse<Branch>, any>({
      query: (body) => ({ url: "/branches", method: "POST", body }),
      invalidatesTags: ["Branches"],
    }),
    updateBranch: build.mutation<ApiResponse<Branch>, { id: number; data: any }>({
      query: ({ id, data }) => ({ url: `/branches/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Branches"],
    }),

    // ── Departments ──
    getDepartments: build.query<ApiResponse<Department[]>, number | void>({
      query: (branchId) => branchId ? `/departments?branch_id=${branchId}` : "/departments",
      providesTags: ["Departments"],
    }),
    createDepartment: build.mutation<ApiResponse<Department>, any>({
      query: (body) => ({ url: "/departments", method: "POST", body }),
      invalidatesTags: ["Departments"],
    }),
    updateDepartment: build.mutation<ApiResponse<Department>, { id: number; data: any }>({
      query: ({ id, data }) => ({ url: `/departments/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Departments"],
    }),

    // ── Categories ──
    getCategories: build.query<ApiResponse<Category[]>, void>({
      query: () => "/categories",
      providesTags: ["Categories"],
    }),

    // ── Transfers ──
    getTransfers: build.query<ApiResponse<TransferRow[]>, { status?: string; page?: number; per_page?: number } | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== "") params.set(k, String(v));
          });
        }
        return `/transfers?${params.toString()}`;
      },
      providesTags: ["Transfers"],
    }),
    createTransfer: build.mutation<ApiResponse<any>, TransferPayload>({
      query: (body) => ({ url: "/transfers", method: "POST", body }),
      invalidatesTags: ["Transfers", "Assets", "Dashboard"],
    }),
    completeTransfer: build.mutation<ApiResponse<any>, number>({
      query: (id) => ({ url: `/transfers/${id}/complete`, method: "PUT" }),
      invalidatesTags: ["Transfers", "Assets", "Dashboard"],
    }),
    cancelTransfer: build.mutation<ApiResponse<any>, number>({
      query: (id) => ({ url: `/transfers/${id}/cancel`, method: "PUT" }),
      invalidatesTags: ["Transfers", "Assets"],
    }),

    // ── Users ──
    getUsers: build.query<ApiResponse<UserRow[]>, { role?: string; status?: string; search?: string; page?: number; per_page?: number } | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== "" && v !== "all") params.set(k, String(v));
          });
        }
        return `/users?${params.toString()}`;
      },
      providesTags: ["Users"],
    }),
    getUser: build.query<ApiResponse<UserRow>, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Users", id }],
    }),
    createUser: build.mutation<ApiResponse<UserRow>, CreateUserPayload>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: build.mutation<ApiResponse<UserRow>, { id: number; data: UpdateUserPayload }>({
      query: ({ id, data }) => ({ url: `/users/${id}`, method: "PUT", body: data }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: build.mutation<ApiResponse<any>, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    toggleUserStatus: build.mutation<ApiResponse<UserRow>, { id: number; status: "active" | "inactive" }>({
      query: ({ id, status }) => ({ url: `/users/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Users"],
    }),

    // ── Procurement ──
    getSuppliers: build.query<ApiResponse<SupplierRow[]>, { search?: string; type?: string; status?: string; page?: number; per_page?: number } | void>({
      query: (p) => ({ url: "/suppliers", params: p || {} }),
    }),
    getSupplier: build.query<ApiResponse<SupplierRow>, number>({
      query: (id) => `/suppliers/${id}`,
    }),
    getSupplierStats: build.query<ApiResponse<SupplierStats>, void>({
      query: () => "/suppliers/stats",
    }),
    createSupplier: build.mutation<ApiResponse<SupplierRow>, Partial<SupplierRow>>({
      query: (body) => ({ url: "/suppliers", method: "POST", body }),
    }),
    updateSupplier: build.mutation<ApiResponse<SupplierRow>, { id: number; data: Partial<SupplierRow> }>({
      query: ({ id, data }) => ({ url: `/suppliers/${id}`, method: "PUT", body: data }),
    }),
    deleteSupplier: build.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/suppliers/${id}`, method: "DELETE" }),
    }),

    getPurchases: build.query<ApiResponse<PurchaseRow[]>, { search?: string; supplier_id?: number; status?: string; from_date?: string; to_date?: string; page?: number; per_page?: number } | void>({
      query: (p) => ({ url: "/purchases", params: p || {} }),
    }),
    getPurchase: build.query<ApiResponse<PurchaseRow>, number>({
      query: (id) => `/purchases/${id}`,
    }),
    getPurchaseStats: build.query<ApiResponse<PurchaseStats>, void>({
      query: () => "/purchases/stats",
    }),
    createPurchase: build.mutation<ApiResponse<PurchaseRow>, CreatePurchasePayload>({
      query: (body) => ({ url: "/purchases", method: "POST", body }),
    }),
    updatePurchase: build.mutation<ApiResponse<PurchaseRow>, { id: number; data: Partial<CreatePurchasePayload> }>({
      query: ({ id, data }) => ({ url: `/purchases/${id}`, method: "PUT", body: data }),
    }),
    approvePurchase: build.mutation<ApiResponse<PurchaseRow>, number>({
      query: (id) => ({ url: `/purchases/${id}/approve`, method: "POST" }),
    }),
    rejectPurchase: build.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/purchases/${id}/reject`, method: "POST" }),
    }),
    generatePurchaseAssets: build.mutation<ApiResponse<{ assets_generated: number; assets: { asset_code: string; name: string }[] }>, number>({
      query: (id) => ({ url: `/purchases/${id}/generate-assets`, method: "POST" }),
    }),

    getAllInvoices: build.query<ApiResponse<PurchaseInvoiceRow[]>, { search?: string } | void>({
      query: (p) => ({ url: "/invoices", params: p || {} }),
    }),
    deleteInvoice: build.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/invoices/${id}`, method: "DELETE" }),
    }),
  }),
});

// ─── Auto-generated hooks ───────────────────────────────────────

export const {
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetDashboardStatsQuery,
  useGetAssetsByCategoryQuery,
  useGetAssetsByBranchQuery,
  useGetRecentActivityQuery,
  useGetExpiringWarrantiesQuery,
  useTrackAssetQuery,
  useGetAssetsQuery,
  useGetAssetQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useGetCategoriesQuery,
  useGetTransfersQuery,
  useCreateTransferMutation,
  useCompleteTransferMutation,
  useCancelTransferMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  // Procurement
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useGetSupplierStatsQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useGetPurchaseStatsQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useApprovePurchaseMutation,
  useRejectPurchaseMutation,
  useGeneratePurchaseAssetsMutation,
  useGetAllInvoicesQuery,
  useDeleteInvoiceMutation,
} = api;
