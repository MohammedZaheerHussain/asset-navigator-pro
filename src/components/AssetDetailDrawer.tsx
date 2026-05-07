import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Wrench, MapPin, ArrowRightLeft, Tag, ShieldCheck, TrendingDown, IndianRupee, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { svcGet } from "@/lib/service-api";

// Asset type aligned with API response shape
interface AssetData {
  asset_code: string;
  name: string;
  category_name?: string;
  description?: string;
  serial_number?: string;
  barcode?: string;
  branch_name?: string;
  department_name?: string;
  status: string;
  assigned_to?: string | null;
  purchase_date?: string | null;
  purchase_cost?: string | null;
  warranty_expiry?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Props {
  asset: AssetData | null;
  onClose: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success-soft text-success border-success/20",
  maintenance: "bg-warning-soft text-warning border-warning/30",
  transfer: "bg-info-soft text-info border-info/20",
  retired: "bg-neutral-soft text-neutral border-neutral/20",
};

export function AssetDetailDrawer({ asset, onClose }: Props) {
  const [svcRecords, setSvcRecords] = useState<any[]>([]);
  const [valuation, setValuation] = useState<any>(null);
  const [svcLoading, setSvcLoading] = useState(false);

  useEffect(() => {
    if (!asset) return;
    setSvcLoading(true);
    Promise.all([
      svcGet(`/assets/${asset.asset_code}/services`).catch(() => ({ data: [] })),
      svcGet(`/assets/${asset.asset_code}/valuation`).catch(() => ({ data: null })),
    ]).then(([svcRes, valRes]) => {
      setSvcRecords(svcRes.data || []);
      setValuation(valRes.data || null);
      setSvcLoading(false);
    });
  }, [asset?.asset_code]);

  if (!asset) return null;

  return (
    <Sheet open={!!asset} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
        {/* Summary header */}
        <div className="bg-gradient-to-br from-primary-soft to-surface px-6 pt-6 pb-5 border-b border-border">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-primary">{asset.asset_code}</span>
              <span>·</span>
              <span>{asset.category_name || "—"}</span>
            </div>
            <SheetTitle className="text-2xl">{asset.name}</SheetTitle>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border font-medium px-2.5 py-0.5 text-xs capitalize", STATUS_BADGE[asset.status] || STATUS_BADGE.active)}>
                {asset.status}
              </span>
              {valuation && (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  valuation.health_status === "healthy" ? "bg-emerald-50 text-emerald-700" :
                  valuation.health_status === "warning" ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                )}>
                  {valuation.health_status === "healthy" ? "●" : valuation.health_status === "warning" ? "▲" : "▼"} {valuation.health_status}
                </span>
              )}
            </div>
          </SheetHeader>
        </div>

        <Tabs defaultValue="overview" className="px-6 pt-5 pb-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="valuation">Valuation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-4">
            <InfoCard icon={Tag} title="Asset Info">
              <Row label="Asset Code" value={asset.asset_code} />
              <Row label="Serial Number" value={asset.serial_number || "—"} />
              <Row label="Barcode" value={asset.barcode || "—"} />
              <Row label="Value" value={asset.purchase_cost ? `₹${Number(asset.purchase_cost).toLocaleString()}` : "—"} />
            </InfoCard>
            {asset.description && (
              <InfoCard icon={Tag} title="Description">
                <p className="text-sm text-muted-foreground col-span-2">{asset.description}</p>
              </InfoCard>
            )}
          </TabsContent>

          <TabsContent value="location" className="mt-5 space-y-4">
            <InfoCard icon={MapPin} title="Current Location">
              <Row label="Branch" value={asset.branch_name || "—"} />
              <Row label="Department" value={asset.department_name || "—"} />
              <Row label="Assigned To" value={asset.assigned_to || "Unassigned"} />
            </InfoCard>
          </TabsContent>

          <TabsContent value="warranty" className="mt-5 space-y-4">
            <InfoCard icon={ShieldCheck} title="Warranty & Dates">
              <Row label="Purchase Date" value={asset.purchase_date || "—"} />
              <Row label="Warranty Expiry" value={asset.warranty_expiry || "—"} />
              <Row label="Created" value={asset.created_at?.substring(0, 10) || "—"} />
              <Row label="Last Updated" value={asset.updated_at?.substring(0, 10) || "—"} />
            </InfoCard>
          </TabsContent>

          {/* Service History Tab */}
          <TabsContent value="service" className="mt-5 space-y-4">
            {svcLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : svcRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>No service records for this asset</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold">{svcRecords.length} Service Records</span>
                  <span className="text-muted-foreground">
                    Total: ₹{svcRecords.reduce((s: number, r: any) => s + Number(r.total_cost || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="space-y-2">
                  {svcRecords.map((r: any) => (
                    <div key={r.id} className="rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                            r.service_type === "corrective" ? "bg-red-50 text-red-600" :
                            r.service_type === "preventive" ? "bg-emerald-50 text-emerald-600" :
                            r.service_type === "calibration" ? "bg-blue-50 text-blue-600" :
                            "bg-amber-50 text-amber-600"
                          )}>
                            {r.service_type}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.service_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <span className="font-mono text-sm font-semibold">₹{Number(r.total_cost).toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-sm mt-1">{r.description}</p>
                      {r.vendor_name && <p className="text-xs text-muted-foreground mt-0.5">Vendor: {r.vendor_name}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Valuation Tab */}
          <TabsContent value="valuation" className="mt-5 space-y-4">
            {svcLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : !valuation ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingDown className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>No depreciation config for this asset's category</p>
              </div>
            ) : (
              <>
                <InfoCard icon={IndianRupee} title="Book Value">
                  <Row label="Purchase Cost" value={`₹${Number(valuation.purchase_cost).toLocaleString("en-IN")}`} />
                  <Row label="Current Book Value" value={`₹${Number(valuation.current_book_value).toLocaleString("en-IN")}`} />
                  <Row label="Total Depreciated" value={`₹${(Number(valuation.purchase_cost) - Number(valuation.current_book_value)).toLocaleString("en-IN")}`} />
                  <Row label="Method" value={valuation.depreciation_method || "—"} />
                </InfoCard>
                <InfoCard icon={Wrench} title="Service Impact">
                  <Row label="Total Service Cost" value={`₹${Number(valuation.total_service_cost).toLocaleString("en-IN")}`} />
                  <Row label="Service / Book Ratio" value={`${valuation.service_cost_ratio}%`} />
                  <Row label="Years Used" value={valuation.years_used || "—"} />
                  <Row label="Remaining Life" value={valuation.remaining_life ? `${valuation.remaining_life} yrs` : "—"} />
                </InfoCard>
                <div className={cn("rounded-xl p-4 text-center font-semibold text-sm",
                  valuation.health_status === "healthy" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  valuation.health_status === "warning" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-red-50 text-red-700 border border-red-200"
                )}>
                  Health: {valuation.health_status?.toUpperCase()} — {
                    valuation.health_status === "healthy" ? "Asset is performing well within threshold" :
                    valuation.health_status === "warning" ? "Service costs approaching threshold limit" :
                    "Service costs exceed threshold — consider condemnation"
                  }
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-lg bg-primary-soft text-primary flex items-center justify-center"><Icon className="h-4 w-4" /></div>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (<><dt className="text-xs text-muted-foreground self-center">{label}</dt><dd className="text-sm font-medium text-foreground">{value}</dd></>);
}
