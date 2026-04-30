import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Package, Barcode } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { branches, departments, branchById, deptById } from "@/lib/mock-data";
import { StatusBadge, WarrantyBadge } from "@/components/StatusBadges";
import { EmptyState } from "@/components/EmptyState";
import { AssetDetailDrawer } from "@/components/AssetDetailDrawer";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store";

export default function AssetRegistry() {
  const [branchFilter, setBranchFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReturnType<typeof useAppSelector<(s: any) => any>> | null>(null);
  const [barcodeAssetId, setBarcodeAssetId] = useState<string | null>(null);

  const allAssets = useAppSelector((s) => s.assets.items);
  const categoryItems = useAppSelector((s) => s.categories.items);
  const activeCategories = categoryItems.filter((c) => c.status === "active");

  const deptOptions = branchFilter === "all" ? departments : departments.filter((d) => d.branchId === branchFilter);

  const filtered = useMemo(() => {
    return allAssets.filter((a) =>
      (branchFilter === "all" || a.branchId === branchFilter) &&
      (deptFilter === "all" || a.departmentId === deptFilter) &&
      (catFilter === "all" || a.category === catFilter) &&
      (!search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()))
    );
  }, [allAssets, branchFilter, deptFilter, catFilter, search]);

  return (
    <>
      <PageHeader
        title="Asset Registry"
        description={`${filtered.length} of ${allAssets.length} assets`}
        actions={<Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/assets/add"><Plus className="h-4 w-4 mr-1.5" />Add Asset</Link>
        </Button>}
      />
      <div className="pt-6 space-y-4">
        <Card className="shadow-elegant p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Branch</Label>
              <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setDeptFilter("all"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {deptOptions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Category</Label>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {activeCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Asset name or ID…" className="pl-9" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="shadow-elegant overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="No assets found" description="Adjust your filters or register a new asset to get started." actionLabel="Add Asset" onAction={() => window.location.href = "/assets/add"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Asset ID</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Location</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Warranty</th>
                    <th className="px-6 py-3 font-semibold text-center">Barcode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-surface-muted cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold" onClick={() => setSelected(a)}>{a.id}</td>
                      <td className="px-6 py-3.5 font-medium" onClick={() => setSelected(a)}>{a.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground" onClick={() => setSelected(a)}>{a.category}</td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs" onClick={() => setSelected(a)}>
                        {branchById(a.branchId)?.alias} · {deptById(a.departmentId)?.alias} · {a.room}
                      </td>
                      <td className="px-6 py-3.5" onClick={() => setSelected(a)}><StatusBadge status={a.status} /></td>
                      <td className="px-6 py-3.5" onClick={() => setSelected(a)}><WarrantyBadge status={a.warrantyStatus} /></td>
                      <td className="px-6 py-3.5 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary-soft"
                          onClick={(e) => { e.stopPropagation(); setBarcodeAssetId(a.id); }}
                          title="View barcode"
                        >
                          <Barcode className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <AssetDetailDrawer asset={selected} onClose={() => setSelected(null)} />

      {/* Barcode Popup Dialog */}
      <Dialog open={!!barcodeAssetId} onOpenChange={(o) => { if (!o) setBarcodeAssetId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-center items-center">
            <DialogTitle className="text-lg">Asset Barcode</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            {barcodeAssetId && <BarcodeDisplay value={barcodeAssetId} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
