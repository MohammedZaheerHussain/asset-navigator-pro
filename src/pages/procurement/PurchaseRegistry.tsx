import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useGetPurchasesQuery, useGetPurchaseQuery, useGetPurchaseStatsQuery, useGetSuppliersQuery,
  useApprovePurchaseMutation, useRejectPurchaseMutation, useGeneratePurchaseAssetsMutation,
  getUser, type PurchaseRow,
} from "@/store/apiSlice";
import {
  ClipboardList, Search, RefreshCw, Loader2, Eye, CheckCircle2, XCircle,
  Sparkles, IndianRupee, Clock, FileCheck, Package, ShoppingCart, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-800",
};

const TIMELINE_LABELS: Record<string, string> = {
  created: "Created", submitted: "Submitted", approved: "Approved",
  rejected: "Rejected", invoice_uploaded: "Invoice Uploaded",
  assets_generated: "Assets Generated", completed: "Completed",
};

export default function PurchaseRegistry() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = getUser();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const { data: purchasesRes, isLoading, refetch } = useGetPurchasesQuery({
    search, status: statusFilter !== "all" ? statusFilter : undefined,
    supplier_id: supplierFilter !== "all" ? Number(supplierFilter) : undefined,
    per_page: 100,
  });
  const { data: statsRes } = useGetPurchaseStatsQuery();
  const { data: suppliersRes } = useGetSuppliersQuery({ per_page: 500 });
  const [approvePurchase] = useApprovePurchaseMutation();
  const [rejectPurchase] = useRejectPurchaseMutation();
  const [generateAssets, { isLoading: generating }] = useGeneratePurchaseAssetsMutation();

  const purchases: PurchaseRow[] = purchasesRes?.data || [];
  const stats = statsRes?.data;
  const suppliers = suppliersRes?.data || [];

  // Detail panel
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data: detailRes, isFetching: loadingDetail } = useGetPurchaseQuery(detailId!, { skip: !detailId });
  const detail = detailRes?.data;

  const fmt = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleApprove = async (id: number) => {
    try {
      await approvePurchase(id).unwrap();
      toast({ title: "Approved", description: "Purchase has been approved" });
      refetch();
    } catch (e: any) { toast({ title: "Error", description: e.data?.message || "Failed", variant: "destructive" }); }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectPurchase(id).unwrap();
      toast({ title: "Rejected", description: "Purchase has been rejected" });
      refetch();
    } catch (e: any) { toast({ title: "Error", description: e.data?.message || "Failed", variant: "destructive" }); }
  };

  const handleGenerate = async (id: number) => {
    try {
      const res = await generateAssets(id).unwrap();
      toast({ title: "Assets Generated!", description: `${res.data?.assets_generated} assets created in the registry` });
      refetch();
    } catch (e: any) { toast({ title: "Error", description: e.data?.message || "Failed", variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-teal-600" /> Purchase Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track all procurement entries, approvals, and asset generation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => navigate("/procurement/purchase/new")} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" /> New Purchase
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Purchases", value: stats?.total ?? 0, color: "border-l-teal-500", icon: ShoppingCart },
          { label: "Pending Approval", value: stats?.pending ?? 0, color: "border-l-amber-500", icon: Clock },
          { label: "Total Spend", value: fmt(stats?.total_spend ?? 0), color: "border-l-emerald-500", icon: IndianRupee },
          { label: "This Month", value: fmt(stats?.month_spend ?? 0), color: "border-l-blue-500", icon: FileCheck },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by code, invoice, supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Suppliers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.supplier_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Purchase</th>
                  <th className="text-left p-3 font-semibold">Supplier</th>
                  <th className="text-left p-3 font-semibold">Invoice</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-right p-3 font-semibold">Amount</th>
                  <th className="text-center p-3 font-semibold">Items</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr></thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">No purchases found</td></tr>
                  ) : purchases.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-mono text-xs font-bold text-teal-700">{p.purchase_code}</div>
                        <div className="text-xs text-muted-foreground">{p.created_by_name}</div>
                      </td>
                      <td className="p-3 font-medium text-sm">{p.supplier_name}</td>
                      <td className="p-3 text-xs font-mono text-muted-foreground">{p.invoice_number || "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(p.purchase_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
                      <td className="p-3 text-right font-semibold">{fmt(p.grand_total)}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Package className="h-3 w-3" /> {p.item_count ?? 0}
                          {Number(p.assets_generated) > 0 && <span className="text-emerald-600 font-semibold ml-1">({p.assets_generated} assets)</span>}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_COLORS[p.status] || STATUS_COLORS.draft)}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailId(p.id)} title="View"><Eye className="h-3.5 w-3.5" /></Button>
                          {isAdmin && p.status === "pending" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => handleApprove(p.id)} title="Approve"><CheckCircle2 className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleReject(p.id)} title="Reject"><XCircle className="h-3.5 w-3.5" /></Button>
                            </>
                          )}
                          {isAdmin && p.status === "approved" && Number(p.assets_generated) === 0 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600" onClick={() => handleGenerate(p.id)} title="Generate Assets" disabled={generating}>
                              <Sparkles className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Purchase Detail — {detail?.purchase_code}
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : detail && (
            <div className="space-y-5">
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Supplier</span><span className="font-medium">{detail.supplier_name}</span></div>
                <div><span className="text-muted-foreground block text-xs">Purchase Date</span><span>{new Date(detail.purchase_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span></div>
                <div><span className="text-muted-foreground block text-xs">Invoice</span><span className="font-mono">{detail.invoice_number || "—"}</span></div>
                <div><span className="text-muted-foreground block text-xs">Branch</span><span>{detail.branch_name}</span></div>
                <div><span className="text-muted-foreground block text-xs">Status</span>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize", STATUS_COLORS[detail.status])}>{detail.status}</span>
                </div>
                <div><span className="text-muted-foreground block text-xs">Grand Total</span><span className="font-bold text-teal-700">{fmt(detail.grand_total)}</span></div>
              </div>

              {/* Timeline */}
              {detail.timeline && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Timeline</h4>
                  <div className="flex items-center gap-1 flex-wrap">
                    {detail.timeline.map((t, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          t.done ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-gray-50 text-gray-400 border-gray-200"
                        )}>
                          {t.done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {TIMELINE_LABELS[t.event] || t.event}
                        </div>
                        {i < detail.timeline!.length - 1 && <div className="w-4 h-px bg-border" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Items ({detail.items?.length})</h4>
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead><tr className="bg-muted/50 border-b">
                    <th className="text-left p-2 font-semibold">Item</th>
                    <th className="text-left p-2 font-semibold">Category</th>
                    <th className="text-center p-2 font-semibold">Qty</th>
                    <th className="text-right p-2 font-semibold">Price</th>
                    <th className="text-right p-2 font-semibold">Total</th>
                  </tr></thead>
                  <tbody>
                    {(detail.items || []).map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2 font-medium">{item.item_name}</td>
                        <td className="p-2 text-xs text-muted-foreground">{item.category_name || "—"}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{fmt(item.unit_price)}</td>
                        <td className="p-2 text-right font-semibold">{fmt(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Generated Assets */}
              {detail.generated_assets && detail.generated_assets.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Generated Assets ({detail.generated_assets.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detail.generated_assets.map((a) => (
                      <span key={a.asset_code} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-mono border border-teal-200">
                        <Package className="h-3 w-3" /> {a.asset_code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial */}
              <div className="max-w-xs ml-auto space-y-2 p-3 rounded-lg bg-muted/50 border">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{fmt(detail.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST</span><span>{fmt(detail.gst_amount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span>-{fmt(detail.discount_amount)}</span></div>
                <div className="border-t my-1" />
                <div className="flex justify-between font-bold"><span>Grand Total</span><span className="text-teal-700">{fmt(detail.grand_total)}</span></div>
              </div>
            </div>
          )}
          <DialogFooter>
            {detail && isAdmin && detail.status === "pending" && (
              <div className="flex gap-2 mr-auto">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { handleApprove(detail.id); setDetailId(null); }}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { handleReject(detail.id); setDetailId(null); }}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </div>
            )}
            {detail && isAdmin && detail.status === "approved" && (detail.generated_assets || []).length === 0 && (
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 mr-auto" onClick={() => { handleGenerate(detail.id); setDetailId(null); }}>
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Generate Assets
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
