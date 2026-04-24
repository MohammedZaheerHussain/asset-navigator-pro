import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, HeartPulse, Boxes } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { assets, branches, branchById, deptById } from "@/lib/mock-data";
import { StatusBadge, WarrantyBadge } from "@/components/StatusBadges";
import { EmptyState } from "@/components/EmptyState";
import { AssetDetailDrawer } from "@/components/AssetDetailDrawer";

interface Props { type: "biomedical" | "other"; }

export default function EquipmentList({ type }: Props) {
  const isBio = type === "biomedical";
  const title = isBio ? "Biomedical Equipment" : "Other Equipment";
  const description = isBio
    ? "All medical equipment registered across the network."
    : "Non-medical equipment: IT, furniture, and general assets.";
  const Icon = isBio ? HeartPulse : Boxes;

  const filteredAll = assets.filter((a) => isBio ? a.category === "Biomedical" : a.category !== "Biomedical");

  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof assets[number] | null>(null);

  const list = filteredAll.filter((a) =>
    (branchFilter === "all" || a.branchId === branchFilter) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="pt-6 space-y-4">
        <Card className="shadow-elegant p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Branch</Label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment…" className="pl-9" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="shadow-elegant overflow-hidden">
          {list.length === 0 ? (
            <EmptyState icon={Icon} title={`No ${isBio ? "biomedical" : "other"} equipment found`} description="Try adjusting your filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Asset ID</th>
                    <th className="px-6 py-3 font-semibold">Equipment</th>
                    <th className="px-6 py-3 font-semibold">Make / Model</th>
                    <th className="px-6 py-3 font-semibold">Location</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Warranty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list.map((a) => (
                    <tr key={a.id} onClick={() => setSelected(a)} className="hover:bg-surface-muted cursor-pointer transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{a.id}</td>
                      <td className="px-6 py-3.5 font-medium">{a.name}<div className="text-xs text-muted-foreground font-normal">{a.category}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{a.make}<div>{a.model}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{branchById(a.branchId)?.alias} · {deptById(a.departmentId)?.alias} · {a.room}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={a.status} /></td>
                      <td className="px-6 py-3.5"><WarrantyBadge status={a.warrantyStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <AssetDetailDrawer asset={selected} onClose={() => setSelected(null)} />
    </>
  );
}
