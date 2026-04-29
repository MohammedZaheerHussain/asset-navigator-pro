/**
 * Tracking Service — Material Tracking API Layer
 * 
 * Simulates backend API calls with proper validation, error handling,
 * and caching. Ready to be swapped with real PHP endpoints.
 * 
 * Future API endpoint: GET /track?type=barcode|serial|assetCode&value=
 */

import { assets, branchById, deptById, transfers } from "./mock-data";
import type { Asset, Transfer } from "./mock-data";

// ─── Types ───────────────────────────────────────────────────────

export type TrackingMode = "barcode" | "serial" | "asset";

export interface TrackingResult {
  asset: Asset;
  branchName: string;
  departmentName: string;
  assignedTo: string;
  lastUpdated: string;
  transferHistory: TransferRecord[];
}

export interface TransferRecord {
  id: string;
  fromBranch: string;
  fromDept: string;
  toBranch: string;
  toDept: string;
  date: string;
  status: "completed" | "in_transit" | "pending";
}

export interface TrackingError {
  type: "empty_input" | "invalid_format" | "not_found" | "server_error";
  message: string;
}

// ─── Barcode Mapping (simulated) ─────────────────────────────────
// In production, barcodes would be stored in the DB. Here we generate
// deterministic barcodes from asset IDs for demonstration.

const barcodeMap: Record<string, string> = {
  "BCR-2948271001": "AST-1001",
  "BCR-5531200002": "AST-1002",
  "BCR-7712340003": "AST-1003",
  "BCR-1109840004": "AST-1004",
  "BCR-2200190005": "AST-1005",
  "BCR-4512210006": "AST-1006",
  "BCR-8822100007": "AST-1007",
  "BCR-9902100008": "AST-1008",
  "BCR-3301280009": "AST-1009",
  "BCR-1109820010": "AST-1010",
};

// Reverse map: assetId → barcode
const assetToBarcodeMap: Record<string, string> = Object.fromEntries(
  Object.entries(barcodeMap).map(([barcode, assetId]) => [assetId, barcode])
);

export function getBarcodeForAsset(assetId: string): string {
  return assetToBarcodeMap[assetId] ?? "N/A";
}

// ─── Validation ──────────────────────────────────────────────────

const VALIDATION_RULES: Record<TrackingMode, { pattern: RegExp; example: string; label: string }> = {
  barcode: {
    pattern: /^BCR-[A-Z0-9]{6,12}$/i,
    example: "BCR-2948271001",
    label: "Barcode",
  },
  serial: {
    pattern: /^[A-Z]{2,5}-[A-Z0-9]{4,10}$/i,
    example: "PHL-948271",
    label: "Serial Number",
  },
  asset: {
    pattern: /^AST-\d{4,6}$/i,
    example: "AST-1001",
    label: "Asset Code",
  },
};

export function validateInput(mode: TrackingMode, value: string): TrackingError | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      type: "empty_input",
      message: "Please enter a value to search.",
    };
  }

  const rule = VALIDATION_RULES[mode];
  if (!rule.pattern.test(trimmed)) {
    return {
      type: "invalid_format",
      message: `Invalid ${rule.label} format. Expected format: ${rule.example}`,
    };
  }

  return null;
}

// ─── Search Cache ────────────────────────────────────────────────

interface CacheEntry {
  result: TrackingResult | null;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30_000; // 30 seconds

function getCacheKey(mode: TrackingMode, value: string): string {
  return `${mode}:${value.trim().toUpperCase()}`;
}

function getCachedResult(key: string): TrackingResult | null | undefined {
  const entry = searchCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    searchCache.delete(key);
    return undefined;
  }
  return entry.result;
}

function setCachedResult(key: string, result: TrackingResult | null) {
  searchCache.set(key, { result, timestamp: Date.now() });
}

// ─── Simulated Assigned Users ────────────────────────────────────

const assignedUsers: Record<string, string> = {
  "AST-1001": "Dr. Mehta",
  "AST-1002": "Nurse Priya",
  "AST-1003": "Biomed Team",
  "AST-1004": "Dr. Ranganathan",
  "AST-1005": "Nurse Anita",
  "AST-1006": "Ward Staff (Pediatrics)",
  "AST-1007": "Dr. Sharma",
  "AST-1008": "IT Admin",
  "AST-1009": "Dr. Venkatesh",
  "AST-1010": "Dr. Anesthesia Team",
};

// ─── Last Updated Timestamps ────────────────────────────────────

const lastUpdated: Record<string, string> = {
  "AST-1001": "2025-04-25 14:30",
  "AST-1002": "2025-04-24 09:15",
  "AST-1003": "2025-04-20 16:45",
  "AST-1004": "2025-04-22 11:00",
  "AST-1005": "2025-04-18 08:30",
  "AST-1006": "2025-04-15 13:20",
  "AST-1007": "2025-04-23 10:50",
  "AST-1008": "2025-04-10 17:00",
  "AST-1009": "2025-04-21 12:30",
  "AST-1010": "2025-04-19 15:45",
};

// ─── Core Search Function ────────────────────────────────────────

function findAsset(mode: TrackingMode, value: string): Asset | undefined {
  const q = value.trim().toUpperCase();

  switch (mode) {
    case "barcode": {
      const assetId = barcodeMap[q];
      if (!assetId) return undefined;
      return assets.find((a) => a.id === assetId);
    }
    case "serial":
      return assets.find((a) => a.serial.toUpperCase() === q);
    case "asset":
      return assets.find((a) => a.id.toUpperCase() === q);
  }
}

function getTransferHistory(assetId: string): TransferRecord[] {
  return transfers
    .filter((t) => t.assetId === assetId)
    .map((t) => ({
      id: t.id,
      fromBranch: t.fromBranch,
      fromDept: t.fromDept,
      toBranch: t.toBranch,
      toDept: t.toDept,
      date: t.date,
      status: t.status,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Track an asset by barcode, serial number, or asset code.
 * Simulates network latency for realistic UX testing.
 * 
 * In production, replace this with:
 *   fetch(`/api/track?type=${mode}&value=${value}`)
 */
export async function trackAsset(
  mode: TrackingMode,
  value: string
): Promise<{ data: TrackingResult | null; error: TrackingError | null }> {
  // Validate input
  const validationError = validateInput(mode, value);
  if (validationError) {
    return { data: null, error: validationError };
  }

  // Check cache
  const cacheKey = getCacheKey(mode, value);
  const cached = getCachedResult(cacheKey);
  if (cached !== undefined) {
    if (cached === null) {
      return {
        data: null,
        error: {
          type: "not_found",
          message: `No asset found matching "${value.trim()}". Please verify the ${VALIDATION_RULES[mode].label.toLowerCase()} and try again.`,
        },
      };
    }
    return { data: cached, error: null };
  }

  // Simulate network delay (150-350ms for realistic feel)
  await new Promise((resolve) =>
    setTimeout(resolve, 150 + Math.random() * 200)
  );

  // Search
  const asset = findAsset(mode, value);

  if (!asset) {
    setCachedResult(cacheKey, null);
    return {
      data: null,
      error: {
        type: "not_found",
        message: `No asset found matching "${value.trim()}". Please verify the ${VALIDATION_RULES[mode].label.toLowerCase()} and try again.`,
      },
    };
  }

  const result: TrackingResult = {
    asset,
    branchName: branchById(asset.branchId)?.name ?? "Unknown",
    departmentName: deptById(asset.departmentId)?.name ?? "Unknown",
    assignedTo: assignedUsers[asset.id] ?? "Unassigned",
    lastUpdated: lastUpdated[asset.id] ?? "N/A",
    transferHistory: getTransferHistory(asset.id),
  };

  setCachedResult(cacheKey, result);
  return { data: result, error: null };
}

/**
 * Auto-detect tracking mode from input value.
 * Useful for barcode scanner input or universal search.
 */
export function detectTrackingMode(value: string): TrackingMode | null {
  const trimmed = value.trim().toUpperCase();

  if (trimmed.startsWith("BCR-")) return "barcode";
  if (trimmed.startsWith("AST-")) return "asset";
  // Serial numbers have varied prefixes — match X{2,5}-pattern
  if (/^[A-Z]{2,5}-[A-Z0-9]+$/.test(trimmed)) return "serial";

  return null;
}

/**
 * Clear the search cache.
 */
export function clearTrackingCache() {
  searchCache.clear();
}
