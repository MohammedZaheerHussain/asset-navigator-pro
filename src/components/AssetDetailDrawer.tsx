import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Asset, branchById, deptById } from "@/lib/mock-data";
import { StatusBadge, WarrantyBadge } from "./StatusBadges";
import { Calendar, Wrench, MapPin, ArrowRightLeft, Tag, ShieldCheck } from "lucide-react";

interface Props {
  asset: Asset | null;
  onClose: () => void;
}

export function AssetDetailDrawer({ asset, onClose }: Props) {
  if (!asset) return null;
  const branch = branchById(asset.branchId);
  const dept = deptById(asset.departmentId);

  return (
    <Sheet open={!!asset} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-y-auto">
        {/* Summary header */}
        <div className="bg-gradient-to-br from-primary-soft to-surface px-6 pt-6 pb-5 border-b border-border">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-primary">{asset.id}</span>
              <span>·</span>
              <span>{asset.category}</span>
            </div>
            <SheetTitle className="text-2xl">{asset.name}</SheetTitle>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <StatusBadge status={asset.status} size="md" />
              <WarrantyBadge status={asset.warrantyStatus} size="md" />
            </div>
          </SheetHeader>
        </div>

        <Tabs defaultValue="overview" className="px-6 pt-5 pb-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="warranty">Warranty & AMC</TabsTrigger>
            <TabsTrigger value="transfers">Transfers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-4">
            <InfoCard icon={Tag} title="Asset Info">
              <Row label="Make" value={asset.make} />
              <Row label="Model" value={asset.model} />
              <Row label="Serial Number" value={asset.serial} />
              <Row label="Value" value={`$${asset.value.toLocaleString()}`} />
            </InfoCard>
            <InfoCard icon={MapPin} title="Current Location">
              <Row label="Branch" value={branch?.name ?? ""} />
              <Row label="Department" value={dept?.name ?? ""} />
              <Row label="Room" value={asset.room} />
            </InfoCard>
            <InfoCard icon={Calendar} title="Key Dates">
              <Row label="Purchase Date" value={asset.purchaseDate} />
              <Row label="Warranty Expiry" value={asset.warrantyExpiry} />
            </InfoCard>
          </TabsContent>

          <TabsContent value="location" className="mt-5 space-y-3">
            <Timeline items={[
              { date: "2025-04-18", title: `Moved to ${dept?.name}`, sub: `${branch?.alias} · ${asset.room}`, icon: MapPin },
              { date: "2024-11-02", title: "Relocated within branch", sub: `Previous room: ${asset.room.slice(0,2)}-099`, icon: ArrowRightLeft },
              { date: asset.purchaseDate, title: "Initial placement", sub: `Commissioned at ${branch?.name}`, icon: ShieldCheck },
            ]} />
          </TabsContent>

          <TabsContent value="warranty" className="mt-5 space-y-4">
            <InfoCard icon={ShieldCheck} title="Warranty Status">
              <Row label="Status" value={<WarrantyBadge status={asset.warrantyStatus} />} />
              <Row label="Expiry Date" value={asset.warrantyExpiry} />
              <Row label="Vendor" value="MedTech Distributors" />
              <Row label="Coverage" value="Parts & labor, on-site service" />
            </InfoCard>
            <InfoCard icon={Wrench} title="AMC History">
              <Row label="Last Service" value="2025-02-12" />
              <Row label="Next Scheduled" value="2025-08-12" />
              <Row label="Service Provider" value="MedTech Biomed Services" />
            </InfoCard>
          </TabsContent>

          <TabsContent value="transfers" className="mt-5 space-y-3">
            <Timeline items={[
              { date: "2025-04-18", title: "Transfer initiated", sub: `${branch?.alias} → ICU`, icon: ArrowRightLeft },
              { date: "2024-09-04", title: "Inter-branch transfer", sub: `North Wing → ${branch?.alias}`, icon: ArrowRightLeft },
            ]} />
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
        <div className="h-7 w-7 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt className="text-xs text-muted-foreground self-center">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </>
  );
}

function Timeline({ items }: { items: { date: string; title: string; sub: string; icon: any }[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <ul className="space-y-4">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <it.icon className="h-4 w-4" />
              </div>
              {i < items.length - 1 && <span className="flex-1 w-px bg-border my-1" />}
            </div>
            <div className="flex-1 pb-2">
              <div className="text-sm font-medium">{it.title}</div>
              <div className="text-xs text-muted-foreground">{it.sub}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{it.date}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
