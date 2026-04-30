import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, HeartPulse, Boxes, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { useGetAssetsQuery, useGetBranchesQuery, type AssetRow } from "@/store/apiSlice";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success-soft text-success", maintenance: "bg-warning-soft text-warning",
  transfer: "bg-info-soft text-info", retired: "bg-neutral-soft text-neutral",
};

interface Props { type: "biomedical" | "other"; }

export default function EquipmentList({ type }: Props) {
  const isBio = type === "biomedical";
  const title = isBio ? "Biomedical Equipment" : "Other Equipment";
  const description = isBio ? "All medical equipment registered across the network." : "Non-medical equipment: IT, furniture, and general assets.";
  const Icon = isBio ? HeartPulse : Boxes;

  const [branchFilter, setBranchFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: branchRes } = useGetBranchesQuery();
  const { data: assetRes, isLoading } = useGetAssetsQuery({
    branch_id: branchFilter !== "all" ? branchFilter : undefined,
    search: search || undefined,
  });

  const branches = branchRes?.data || [];
  const allAssets = assetRes?.data || [];

  // Filter by equipment type on client side (category-based)
  const bioCategories = ["Medical Equipment", "Biomedical", "Safety Equipment"];
  const list = allAssets.filter((a: AssetRow) => {
    const cat = a.category_name?.toLowerCase() || "";
    const isBioAsset = bioCategories.some((c) => cat.includes(c.toLowerCase()));
    return isBio ? isBioAsset : !isBioAsset;
  });

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
                  {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 text-primary animate-spin" /><span className="ml-2 text-sm text-muted-foreground">Loading…</span></div>
          ) : list.length === 0 ? (
            <EmptyState icon={Icon} title={`No ${isBio ? "biomedical" : "other"} equipment found`} description="Try adjusting your filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Asset Code</th>
                    <th className="px-6 py-3 font-semibold">Equipment</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Location</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {list.map((a: AssetRow) => (
                    <tr key={a.asset_code} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{a.asset_code}</td>
                      <td className="px-6 py-3.5 font-medium">{a.name}<div className="text-xs text-muted-foreground font-normal">{a.serial_number}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{a.category_name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{a.branch_name} · {a.department_name}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_BADGE[a.status] || "bg-neutral-soft text-neutral")}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
