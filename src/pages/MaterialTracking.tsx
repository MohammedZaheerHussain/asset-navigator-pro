import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ScanLine,
  Search,
  MapPin,
  Tag,
  ShieldCheck,
  Bell,
  Hash,
  QrCode,
  ArrowRightLeft,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Copy,
  Check,
  Zap,
  CircleDot,
  Building2,
  Calendar,
  DollarSign,
  Truck,
  Timer,
  FileText,
  Activity,
  Wrench,
  Shield,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadges";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import {
  trackAsset,
  detectTrackingMode,
  type TrackingMode,
  type TrackingResult,
  type TrackingError,
  type HistoryEntry,
  type ReportEntry,
} from "@/lib/tracking-service";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { CameraScanner } from "@/components/CameraScanner";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

// ─── Tab Config ──────────────────────────────────────────────────

const TABS: { id: TrackingMode; label: string; icon: typeof Search; placeholder: string; example: string }[] = [
  {
    id: "barcode",
    label: "QR Code",
    icon: QrCode,
    placeholder: "Scan QR code or enter value…",
    example: "AST-MED-001",
  },
  {
    id: "serial",
    label: "Serial Number",
    icon: Hash,
    placeholder: "Enter serial number…",
    example: "SN-PHI-MRI-78234",
  },
  {
    id: "asset",
    label: "Asset Code",
    icon: Tag,
    placeholder: "Enter asset code…",
    example: "AST-MED-001",
  },
];

// ─── Main Component ──────────────────────────────────────────────

export default function MaterialTracking() {
  const [mode, setMode] = useState<TrackingMode>("barcode");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<TrackingError | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Focus input on mount and on mode change
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [mode]);

  // Scroll to results when data loads
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // ─── Barcode Scanner Hook ────────────────────────────────────

  const handleBarcodeScan = useCallback(
    (scannedValue: string) => {
      const detectedMode = detectTrackingMode(scannedValue);
      if (detectedMode) {
        setMode(detectedMode);
      }
      setQuery(scannedValue);
      performSearch(detectedMode ?? mode, scannedValue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  );

  const { handleScannerKeyDown } = useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: mode === "barcode",
  });

  // ─── Search Logic ────────────────────────────────────────────

  async function performSearch(searchMode: TrackingMode, searchValue: string) {
    if (!searchValue.trim()) {
      setError({
        type: "empty_input",
        message: "Please enter a value to search.",
      });
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    try {
      const response = await trackAsset(searchMode, searchValue);

      if (response.error) {
        setError(response.error);
        setResult(null);
      } else {
        setResult(response.data);
        setError(null);
      }
    } catch {
      setError({
        type: "server_error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch(mode, query);
  }

  function handleModeSwitch(newMode: TrackingMode) {
    setMode(newMode);
    setQuery("");
    setResult(null);
    setError(null);
    setHasSearched(false);
  }

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  // ─── Current Tab Config ──────────────────────────────────────

  const currentTab = TABS.find((t) => t.id === mode)!;

  // ─── Render ──────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Material Tracking"
        description="Locate assets instantly using QR code, serial number, or asset code."
      />

      <div className="pt-6 space-y-5 max-w-5xl">
        {/* ── Search Card ────────────────────────────────────── */}
        <Card className="shadow-elegant overflow-hidden">
          <CardContent className="p-0">
            {/* Tab Bar */}
            <div className="flex border-b border-border">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleModeSwitch(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-all relative",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="p-5">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (error) setError(null);
                    }}
                    onKeyDown={mode === "barcode" ? handleScannerKeyDown : undefined}
                    placeholder={currentTab.placeholder}
                    className={cn(
                      "pl-10 h-12 text-base border-2 transition-colors",
                      error && hasSearched
                        ? "border-destructive/50 focus-visible:ring-destructive/30"
                        : "border-border focus-visible:ring-primary/30"
                    )}
                    autoFocus
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setResult(null);
                        setError(null);
                        setHasSearched(false);
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <CameraScanner
                  onScan={(val) => {
                    const detected = detectTrackingMode(val);
                    if (detected) setMode(detected);
                    setQuery(val);
                    performSearch(detected ?? mode, val);
                  }}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 px-8 bg-gradient-primary text-primary-foreground shadow-glow hover:shadow-lg transition-all text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching…
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track
                    </>
                  )}
                </Button>
              </form>

              {/* Helper Text */}
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>
                  {mode === "barcode"
                    ? "QR scanner ready — scan to auto-search"
                    : `Try: ${currentTab.example}`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Loading State ──────────────────────────────────── */}
        {isLoading && (
          <Card className="shadow-elegant">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-primary-soft flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Search className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Searching assets…</p>
                  <p className="text-xs text-muted-foreground mt-1">Querying by {currentTab.label.toLowerCase()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Empty / Initial State ──────────────────────────── */}
        {!hasSearched && !isLoading && (
          <Card className="shadow-elegant">
            <EmptyState
              icon={ScanLine}
              title="Start tracking an asset"
              description="Choose a search method above and enter an identifier to view full asset intelligence."
            />
          </Card>
        )}

        {/* ── Error State ────────────────────────────────────── */}
        {error && !isLoading && (
          <Card className="shadow-elegant border-destructive/20">
            <CardContent className="py-10">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-danger-soft flex items-center justify-center">
                  {error.type === "not_found" ? (
                    <Search className="h-7 w-7 text-danger" />
                  ) : (
                    <AlertCircle className="h-7 w-7 text-danger" />
                  )}
                </div>
                <div className="text-center max-w-md">
                  <h3 className="text-base font-semibold text-foreground">
                    {error.type === "not_found"
                      ? "Asset not found"
                      : error.type === "invalid_format"
                        ? "Invalid input format"
                        : error.type === "empty_input"
                          ? "No input provided"
                          : "Something went wrong"}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{error.message}</p>
                </div>
                {error.type === "not_found" && (
                  <div className="flex gap-2 mt-2">
                    {TABS.filter((t) => t.id !== mode).map((t) => (
                      <Button
                        key={t.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleModeSwitch(t.id);
                          setQuery(query);
                        }}
                        className="text-xs"
                      >
                        Try {t.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Results ────────────────────────────────────────── */}
        {result && !isLoading && (
          <div ref={resultRef} className="space-y-4 animate-fade-in">
            {/* Hero Card — Asset Summary */}
            <Card className="shadow-elevated overflow-hidden">
              <div className="h-1.5 bg-gradient-primary" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CopyableCode
                        value={result.asset.id}
                        copied={copiedField === "id"}
                        onCopy={() => handleCopy(result.asset.id, "id")}
                      />
                      <StatusBadge status={result.asset.status} size="md" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                      {result.asset.name}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {result.asset.category}
                      </span>
                      {result.asset.description && (
                        <>
                          <span>·</span>
                          <span>{result.asset.description}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      result.asset.warrantyStatus === 'active' ? 'bg-green-100 text-green-700' :
                      result.asset.warrantyStatus === 'expiring' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {result.asset.warrantyStatus === 'active' ? 'Warranty Active' :
                       result.asset.warrantyStatus === 'expiring' ? 'Expiring Soon' :
                       result.asset.warrantyStatus === 'expired' ? 'Expired' : result.asset.warrantyStatus}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated: {result.lastUpdated}
                    </span>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
                  <QuickStat
                    icon={MapPin}
                    label="Location"
                    value={result.branchName.replace("SNHRC ", "")}
                    accent="primary"
                  />
                  <QuickStat
                    icon={Building2}
                    label="Department"
                    value={result.departmentName}
                    accent="info"
                  />
                  <QuickStat
                    icon={User}
                    label="Assigned To"
                    value={result.assignedTo}
                    accent="success"
                  />
                  <QuickStat
                    icon={DollarSign}
                    label="Value"
                    value={result.asset.purchaseCost ? `₹${Number(result.asset.purchaseCost).toLocaleString()}` : 'N/A'}
                    accent="warning"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Detail Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Card */}
              <DetailCard icon={MapPin} title="Location & Assignment" accent="primary">
                <DetailRow label="Branch" value={result.branchName} />
                <DetailRow label="Department" value={result.departmentName} />
                <DetailRow label="Branch Code" value={result.branchCode} highlight />
                <DetailRow label="Assigned To" value={result.assignedTo} />
              </DetailCard>

              {/* Asset Details Card */}
              <DetailCard icon={Tag} title="Asset Identity" accent="info">
                <DetailRow label="Asset Code">
                  <CopyableCode
                    value={result.asset.id}
                    copied={copiedField === "id2"}
                    onCopy={() => handleCopy(result.asset.id, "id2")}
                  />
                </DetailRow>
                <DetailRow label="Serial Number">
                  <CopyableCode
                    value={result.asset.serial || 'N/A'}
                    copied={copiedField === "serial"}
                    onCopy={() => handleCopy(result.asset.serial, "serial")}
                  />
                </DetailRow>
                <DetailRow label="QR Code">
                  <CopyableCode
                    value={result.asset.barcode || result.asset.id}
                    copied={copiedField === "qrcode"}
                    onCopy={() => handleCopy(result.asset.barcode || result.asset.id, "qrcode")}
                  />
                </DetailRow>
                <DetailRow label="Category" value={result.asset.category} />
              </DetailCard>

              {/* Warranty Card */}
              <DetailCard icon={ShieldCheck} title="Warranty & Purchase" accent="success">
                <DetailRow label="Status">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    result.asset.warrantyStatus === 'active' ? 'bg-green-100 text-green-700' :
                    result.asset.warrantyStatus === 'expiring' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {result.asset.warrantyStatus}
                  </span>
                </DetailRow>
                <DetailRow label="Purchase Date">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {result.asset.purchaseDate || 'N/A'}
                  </span>
                </DetailRow>
                <DetailRow label="Warranty Expiry">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {result.asset.warrantyExpiry || 'N/A'}
                    {result.asset.warrantyDaysRemaining != null && (
                      <span className="text-xs text-muted-foreground">({result.asset.warrantyDaysRemaining}d)</span>
                    )}
                  </span>
                </DetailRow>
                <DetailRow label="Purchase Cost" value={result.asset.purchaseCost ? `₹${Number(result.asset.purchaseCost).toLocaleString()}` : 'N/A'} />
              </DetailCard>

              {/* Alerts Card */}
              <DetailCard icon={Bell} title="Alerts & Notifications" accent="warning">
                <div className="space-y-3">
                  {result.activityLog && result.activityLog.length > 0 ? (
                    <>
                      <div className="flex items-start gap-3 bg-warning-soft text-warning rounded-lg p-3">
                        <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Activity Logged</p>
                          <p className="text-xs mt-0.5 opacity-80">
                            {result.activityLog.length} activity event{result.activityLog.length > 1 ? 's' : ''} recorded for this asset.
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {result.activityLog.slice(0, 3).map((log, i) => (
                          <p key={i}>• {log.action.replace(/_/g, ' ')} — {log.performedBy} ({log.timestamp.substring(0, 10)})</p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 bg-surface-muted rounded-lg p-3">
                      <Bell className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">No Activity Recorded</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          No activity events found for this asset.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </DetailCard>

              {/* Lifecycle Card */}
              <DetailCard icon={Timer} title="Asset Lifecycle" accent="info">
                <DetailRow label="Current Status">
                  <StatusBadge status={result.lifecycle.currentStatus} size="sm" />
                </DetailRow>
                <DetailRow label="Asset Age">
                  <span className="text-sm font-semibold">
                    {result.lifecycle.assetAgeDays != null
                      ? result.lifecycle.assetAgeDays >= 365
                        ? `${Math.floor(result.lifecycle.assetAgeDays / 365)}y ${result.lifecycle.assetAgeDays % 365}d`
                        : `${result.lifecycle.assetAgeDays} days`
                      : 'N/A'}
                  </span>
                </DetailRow>
                <DetailRow label="Warranty">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    result.lifecycle.warrantyStatus === 'active' ? 'bg-green-100 text-green-700' :
                    result.lifecycle.warrantyStatus === 'expiring_soon' ? 'bg-orange-100 text-orange-700' :
                    result.lifecycle.warrantyStatus === 'expired' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {result.lifecycle.warrantyStatus === 'active' ? `Active (${result.lifecycle.warrantyDays}d)` :
                     result.lifecycle.warrantyStatus === 'expiring_soon' ? `Expiring (${result.lifecycle.warrantyDays}d)` :
                     result.lifecycle.warrantyStatus === 'expired' ? 'Expired' : 'No Warranty'}
                  </span>
                </DetailRow>
                <DetailRow label="Registered" value={result.createdAt} />
              </DetailCard>
            </div>

            {/* ── QR Code Card ────────────────────────────────── */}
            <Card className="shadow-elegant">
              <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
                <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                  <QrCode className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base">Asset QR Code</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scan this QR code to instantly track this asset
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <QRCodeDisplay
                  value={result.asset.id}
                  label={result.asset.name}
                  size={220}
                />
              </CardContent>
            </Card>

            {/* ── Unified History Timeline ─────────────────────── */}
            {result.history && result.history.length > 0 && (
              <Card className="shadow-elegant">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
                  <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                    <Activity className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Asset History</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.history.length} event{result.history.length > 1 ? 's' : ''} — complete lifecycle timeline
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-[17px] top-0 bottom-0 w-px bg-border" />
                    {result.history.map((event, idx) => (
                      <HistoryTimelineItem key={idx} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Reports Section ──────────────────────────────── */}
            {result.reports && result.reports.length > 0 && (
              <Card className="shadow-elegant">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
                  <div className="h-9 w-9 rounded-xl bg-warning-soft text-warning flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Reports & Alerts</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.reports.length} report{result.reports.length > 1 ? 's' : ''} for this asset
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.reports.map((report, idx) => (
                    <ReportCard key={idx} report={report} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ── Transfer History (legacy, kept for detailed transfer view) ── */}
            {result.transferHistory.length > 0 && (
              <Card className="shadow-elegant">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
                  <div className="h-9 w-9 rounded-xl bg-info-soft text-info flex items-center justify-center">
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Transfer Details</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {result.transferHistory.length} transfer{result.transferHistory.length > 1 ? "s" : ""} recorded
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-[17px] top-0 bottom-0 w-px bg-border" />
                    {result.transferHistory.map((transfer) => (
                      <div key={transfer.id} className="relative flex gap-4 pb-6 last:pb-0">
                        <div className={cn(
                          "relative z-10 flex-shrink-0 h-9 w-9 rounded-full border-2 flex items-center justify-center",
                          transfer.status === "in_transit"
                            ? "border-info bg-info-soft"
                            : transfer.status === "completed"
                              ? "border-success bg-success-soft"
                              : "border-warning bg-warning-soft"
                        )}>
                          {transfer.status === "in_transit" ? (
                            <ArrowRightLeft className="h-4 w-4 text-info" />
                          ) : transfer.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Clock className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        <div className="flex-1 bg-surface-muted rounded-xl p-4 hover:bg-muted/60 transition-colors">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{transfer.id}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] uppercase tracking-wider font-semibold",
                                  transfer.status === "in_transit"
                                    ? "border-info/30 text-info bg-info-soft"
                                    : transfer.status === "completed"
                                      ? "border-success/30 text-success bg-success-soft"
                                      : "border-warning/30 text-warning bg-warning-soft"
                                )}
                              >
                                {transfer.status === "in_transit" ? "In Transit" : transfer.status === "completed" ? "Completed" : "Pending"}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {transfer.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="font-medium text-foreground">{transfer.fromBranch}</span>
                            <span className="text-xs text-muted-foreground">({transfer.fromDept})</span>
                            <ArrowRightLeft className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="font-medium text-foreground">{transfer.toBranch}</span>
                            <span className="text-xs text-muted-foreground">({transfer.toDept})</span>
                          </div>
                          {transfer.reason && (
                            <p className="text-xs text-muted-foreground mt-2 italic">"{transfer.reason}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

/** Detail Card with colored accent icon */
function DetailCard({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  accent: "primary" | "info" | "success" | "warning";
  children: React.ReactNode;
}) {
  const accentClasses = {
    primary: "bg-primary-soft text-primary",
    info: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  };

  return (
    <Card className="shadow-elegant hover:shadow-elevated transition-shadow duration-300">
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", accentClasses[accent])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

/** Row for detail cards — label / value */
function DetailRow({
  label,
  value,
  children,
  highlight,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm gap-3">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      {children ?? (
        <span
          className={cn(
            "font-medium text-right truncate",
            highlight && "text-primary font-semibold"
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

/** Copyable Code Badge */
function CopyableCode({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-muted hover:bg-muted/80 font-mono text-xs font-semibold text-primary transition-colors group"
      title="Click to copy"
    >
      {value}
      {copied ? (
        <Check className="h-3 w-3 text-success" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

/** Quick Stat mini-card */
function QuickStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  accent: "primary" | "info" | "success" | "warning";
}) {
  const dotColors = {
    primary: "text-primary",
    info: "text-info",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted/60 hover:bg-surface-muted transition-colors">
      <CircleDot className={cn("h-4 w-4 flex-shrink-0", dotColors[accent])} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

/** History Timeline Item — unified activity + transfer events */
function HistoryTimelineItem({ event }: { event: HistoryEntry }) {
  const actionConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    created:             { icon: CheckCircle2,   color: "text-success",  bg: "border-success bg-success-soft" },
    updated:             { icon: Activity,       color: "text-info",     bg: "border-info bg-info-soft" },
    transferred:         { icon: ArrowRightLeft, color: "text-info",     bg: "border-info bg-info-soft" },
    transfer_completed:  { icon: CheckCircle2,   color: "text-success",  bg: "border-success bg-success-soft" },
    transfer_cancelled:  { icon: XCircle,        color: "text-danger",   bg: "border-danger bg-danger-soft" },
    status_changed:      { icon: Zap,            color: "text-warning",  bg: "border-warning bg-warning-soft" },
    assigned:            { icon: User,           color: "text-primary",  bg: "border-primary bg-primary-soft" },
    unassigned:          { icon: User,           color: "text-muted-foreground", bg: "border-muted bg-muted" },
    deleted:             { icon: XCircle,        color: "text-danger",   bg: "border-danger bg-danger-soft" },
    restored:            { icon: CheckCircle2,   color: "text-success",  bg: "border-success bg-success-soft" },
  };

  const config = actionConfig[event.action] || { icon: CircleDot, color: "text-muted-foreground", bg: "border-muted bg-surface-muted" };
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4 pb-5 last:pb-0">
      <div className={cn("relative z-10 flex-shrink-0 h-9 w-9 rounded-full border-2 flex items-center justify-center", config.bg)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 bg-surface-muted rounded-xl p-3.5 hover:bg-muted/60 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-semibold", config.bg.replace("border-", "border-").replace("bg-", "text-").split(" ")[0])}>
              {event.type === "transfer" ? "Transfer" : "Activity"}
            </Badge>
            <span className="text-xs font-medium text-foreground">
              {event.action.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.timestamp ? new Date(event.timestamp).toLocaleString() : "—"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{event.description}</p>
        {event.performedBy && (
          <p className="text-[10px] text-muted-foreground/70 mt-1.5 flex items-center gap-1">
            <User className="h-3 w-3" /> {event.performedBy}
          </p>
        )}
      </div>
    </div>
  );
}

/** Report Card — warranty alerts, transfer reports, maintenance records */
function ReportCard({ report }: { report: ReportEntry }) {
  const severityConfig = {
    critical: { bg: "bg-red-50 border-red-200", icon: AlertCircle, iconColor: "text-red-600", titleColor: "text-red-800" },
    warning:  { bg: "bg-orange-50 border-orange-200", icon: Bell, iconColor: "text-orange-600", titleColor: "text-orange-800" },
    info:     { bg: "bg-blue-50 border-blue-200", icon: FileText, iconColor: "text-blue-600", titleColor: "text-blue-800" },
  };

  const config = severityConfig[report.severity] || severityConfig.info;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-start gap-3 rounded-xl p-4 border", config.bg)}>
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn("text-sm font-semibold", config.titleColor)}>{report.title}</h4>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {report.date ? new Date(report.date).toLocaleDateString() : ""}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{report.description}</p>
      </div>
    </div>
  );
}
