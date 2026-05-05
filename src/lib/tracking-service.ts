/**
 * Tracking Service — Smart Tracking via RTK-compatible fetch
 *
 * Now sends GET /api/track?value=XXX (no type param — backend auto-detects).
 * Kept as a standalone service for the MaterialTracking page which needs
 * manual control over loading/error states and barcode scanner integration.
 */

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") + "/api";

// ─── Types ──────────────────────────────────────────────────────

export type TrackingMode = "barcode" | "serial" | "asset";

export interface TrackingResult {
  asset: {
    id: string;
    name: string;
    description: string;
    category: string;
    serial: string;
    barcode: string;
    status: "active" | "maintenance" | "transfer" | "retired";
    warrantyExpiry: string | null;
    warrantyStatus: string;
    warrantyDaysRemaining: number | null;
    purchaseDate: string | null;
    purchaseCost: string | null;
  };
  branchName: string;
  branchCode: string;
  departmentName: string;
  departmentCode: string;
  assignedTo: string;
  lastUpdated: string;
  transferHistory: TransferEntry[];
  activityLog: ActivityEntry[];
}

export interface TransferEntry {
  id: string;
  fromBranch: string;
  fromDept: string;
  toBranch: string;
  toDept: string;
  status: string;
  reason: string | null;
  initiatedBy: string;
  completedBy: string | null;
  date: string;
  completedDate: string | null;
}

export interface ActivityEntry {
  action: string;
  details: any;
  performedBy: string;
  timestamp: string;
}

export interface TrackingError {
  type: "not_found" | "invalid_format" | "server_error" | "empty_input";
  message: string;
}

export interface TrackingResponse {
  data: TrackingResult | null;
  error: TrackingError | null;
}

// ─── Detection ──────────────────────────────────────────────────

export function detectTrackingMode(value: string): TrackingMode | null {
  const v = value.trim();
  if (/^AST-/i.test(v)) return "asset";
  if (/^BAR/i.test(v) || /^\d{8,}$/.test(v)) return "barcode";
  if (/^SN-/i.test(v)) return "serial";
  return null;
}

// ─── Smart Track (value-only) ───────────────────────────────────

export async function trackAsset(
  _mode: TrackingMode,
  value: string
): Promise<TrackingResponse> {
  const trimmed = value.trim();

  if (!trimmed) {
    return { data: null, error: { type: "empty_input", message: "Please enter a value to search." } };
  }
  if (trimmed.length < 2) {
    return { data: null, error: { type: "invalid_format", message: "Search value must be at least 2 characters." } };
  }

  try {
    const token = localStorage.getItem("snhrc_token");
    const res = await fetch(
      `${API_BASE}/track?value=${encodeURIComponent(trimmed)}`,
      {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    const json = await res.json();

    if (!res.ok || !json.success) {
      if (res.status === 404) {
        return {
          data: null,
          error: {
            type: "not_found",
            message: json.message || `No asset found matching "${trimmed}".`,
          },
        };
      }
      return {
        data: null,
        error: {
          type: "server_error",
          message: json.message || "Server error occurred.",
        },
      };
    }

    const d = json.data;

    const result: TrackingResult = {
      asset: {
        id: d.asset_code,
        name: d.name,
        description: d.description || "",
        category: d.category || "",
        serial: d.serial_number || "",
        barcode: d.barcode || "",
        status: d.status || "active",
        warrantyExpiry: d.warranty?.expiry || null,
        warrantyStatus: d.warranty?.status || "no_warranty",
        warrantyDaysRemaining: d.warranty?.days_remaining ?? null,
        purchaseDate: d.purchase_date || null,
        purchaseCost: d.purchase_cost || null,
      },
      branchName: d.location?.branch || "",
      branchCode: d.location?.branch_code || "",
      departmentName: d.location?.department || "",
      departmentCode: d.location?.department_code || "",
      assignedTo: d.assigned_to || "Unassigned",
      lastUpdated: d.last_updated
        ? new Date(d.last_updated).toLocaleDateString()
        : "—",
      transferHistory: (d.transfer_history || []).map((t: any) => ({
        id: `TRF-${t.id}`,
        fromBranch: t.from_branch || "",
        fromDept: t.from_department || "",
        toBranch: t.to_branch || "",
        toDept: t.to_department || "",
        status: t.status || "pending",
        reason: t.reason || null,
        initiatedBy: t.initiated_by || "",
        completedBy: t.completed_by || null,
        date: t.initiated_at
          ? new Date(t.initiated_at).toLocaleDateString()
          : "—",
        completedDate: t.completed_at
          ? new Date(t.completed_at).toLocaleDateString()
          : null,
      })),
      activityLog: (d.activity_log || []).map((a: any) => ({
        action: a.action || "",
        details: a.details || {},
        performedBy: a.performed_by || "",
        timestamp: a.timestamp || "",
      })),
    };

    return { data: result, error: null };
  } catch {
    return {
      data: null,
      error: {
        type: "server_error",
        message: "Unable to connect to the server. Please check your connection.",
      },
    };
  }
}
