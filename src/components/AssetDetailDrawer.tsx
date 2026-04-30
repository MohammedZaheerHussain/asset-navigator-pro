import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Wrench, MapPin, ArrowRightLeft, Tag, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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
            </div>
          </SheetHeader>
        </div>

        <Tabs defaultValue="overview" className="px-6 pt-5 pb-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="warranty">Warranty</TabsTrigger>
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
