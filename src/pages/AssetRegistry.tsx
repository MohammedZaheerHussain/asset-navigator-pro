import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Package, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "react-router-dom";
import { useGetAssetsQuery, useGetBranchesQuery, useGetCategoriesQuery, type AssetRow } from "@/store/apiSlice";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success-soft text-success", maintenance: "bg-warning-soft text-warning",
  transfer: "bg-info-soft text-info", retired: "bg-neutral-soft text-neutral",
};

export default function AssetRegistry() {
  const [branchFilter, setBranchFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: branchRes } = useGetBranchesQuery();
  const { data: catRes } = useGetCategoriesQuery();
  const { data: assetRes, isLoading } = useGetAssetsQuery({
    branch_id: branchFilter !== "all" ? branchFilter : undefined,
    category_id: catFilter !== "all" ? catFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
    page,
    per_page: 20,
  });

  const branches = branchRes?.data || [];
  const categories = catRes?.data || [];
  const assets = assetRes?.data || [];
  const pagination = assetRes?.pagination;

  return (
    <>
      <PageHeader title="Asset Registry" description={`${pagination?.total ?? assets.length} assets`}
        actions={<Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/assets/add"><Plus className="h-4 w-4 mr-1.5" />Add Asset</Link></Button>} />
      <div className="pt-6 space-y-4">
        <Card className="shadow-elegant p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Branch</Label>
              <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Category</Label>
              <Select value={catFilter} onValueChange={(v) => { setCatFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase text-muted-foreground tracking-wide">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Asset name or code…" className="pl-9" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="shadow-elegant overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 text-primary animate-spin" /><span className="ml-2 text-sm text-muted-foreground">Loading assets…</span></div>
          ) : assets.length === 0 ? (
            <EmptyState icon={Package} title="No assets found" description="Adjust your filters or register a new asset." actionLabel="Add Asset" onAction={() => window.location.href = "/assets/add"} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Asset Code</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Location</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Warranty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assets.map((a: AssetRow) => (
                    <tr key={a.asset_code} className="hover:bg-surface-muted cursor-pointer transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{a.asset_code}</td>
                      <td className="px-6 py-3.5 font-medium">{a.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{a.category_name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{a.branch_name} · {a.department_name}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", STATUS_BADGE[a.status] || "bg-neutral-soft text-neutral")}>{a.status}</span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-muted-foreground">{a.warranty_expiry || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {pagination && pagination.last_page > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {pagination.from}–{pagination.to} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Prev
              </Button>
              <span className="text-sm font-medium">Page {page} of {pagination.last_page}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
