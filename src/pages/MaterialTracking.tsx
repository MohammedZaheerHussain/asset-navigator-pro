import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Search, MapPin, Tag, ShieldCheck, Bell } from "lucide-react";
import { assets, branchById, deptById } from "@/lib/mock-data";
import { StatusBadge, WarrantyBadge } from "@/components/StatusBadges";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

type Mode = "barcode" | "serial" | "asset";

export default function MaterialTracking() {
  const [mode, setMode] = useState<Mode>("asset");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  const result = (() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return assets.find((a) => {
      if (mode === "asset") return a.id.toLowerCase() === q || a.id.toLowerCase().includes(q);
      if (mode === "serial") return a.serial.toLowerCase().includes(q);
      return a.serial.toLowerCase().includes(q);
    });
  })();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearched(true);
  }

  return (
    <>
      <PageHeader title="Material Tracking" description="Locate assets instantly using barcode, serial, or asset code." />
      <div className="pt-6 space-y-5 max-w-4xl">
        <Card className="shadow-elegant">
          <CardContent className="p-5 space-y-4">
            <div className="inline-flex p-1 bg-surface-muted rounded-lg">
              {([
                { id: "barcode", label: "Barcode" },
                { id: "serial", label: "Serial Number" },
                { id: "asset", label: "Asset Code" },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setMode(opt.id); setSearched(false); }}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    mode === opt.id ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
                  placeholder={mode === "asset" ? "Enter asset code, e.g. AST-1001" : mode === "serial" ? "Enter serial number" : "Scan or enter barcode"}
                  className="pl-9 h-11"
                  autoFocus
                />
              </div>
              <Button type="submit" className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90">Track</Button>
            </form>
          </CardContent>
        </Card>

        {!searched && !query && (
          <Card className="shadow-elegant">
            <EmptyState icon={ScanLine} title="Start tracking an asset" description="Choose a search method above and enter an identifier to view full asset intelligence." />
          </Card>
        )}

        {searched && !result && (
          <Card className="shadow-elegant">
            <EmptyState icon={Search} title="No asset found" description={`No record matches "${query}". Try a different identifier or search method.`} />
          </Card>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <Card className="shadow-elegant md:col-span-2">
              <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs font-mono text-primary font-semibold">{result.id}</div>
                  <div className="text-xl font-semibold mt-1">{result.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{result.category} · {result.make} {result.model}</div>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={result.status} size="md" />
                  <WarrantyBadge status={result.warrantyStatus} size="md" />
                </div>
              </CardContent>
            </Card>

            <ResultCard icon={MapPin} title="Location">
              <Row label="Branch" value={branchById(result.branchId)?.name ?? "-"} />
              <Row label="Department" value={deptById(result.departmentId)?.name ?? "-"} />
              <Row label="Room" value={result.room} />
            </ResultCard>
            <ResultCard icon={Tag} title="Asset Details">
              <Row label="Make" value={result.make} />
              <Row label="Model" value={result.model} />
              <Row label="Serial" value={result.serial} />
              <Row label="Value" value={`$${result.value.toLocaleString()}`} />
            </ResultCard>
            <ResultCard icon={ShieldCheck} title="Warranty">
              <Row label="Status" value={<WarrantyBadge status={result.warrantyStatus} />} />
              <Row label="Expiry" value={result.warrantyExpiry} />
              <Row label="Purchased" value={result.purchaseDate} />
            </ResultCard>
            <ResultCard icon={Bell} title="Alerts">
              {result.alertEnabled ? (
                <div className="text-sm text-warning bg-warning-soft px-3 py-2 rounded-md">
                  Alert active — staff notified on lifecycle events.
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No alerts configured for this asset.</div>
              )}
            </ResultCard>
          </div>
        )}
      </div>
    </>
  );
}

function ResultCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-elegant">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
        <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center text-sm gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
