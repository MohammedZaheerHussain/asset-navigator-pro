import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText, ShieldAlert, Building2, ArrowLeftRight, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetBranchesQuery, useGetExpiringWarrantiesQuery, useGetTransfersQuery, useGetAssetsQuery } from "@/store/apiSlice";

const reportTypes = [
  { id: "warranty", label: "Expiring Warranties", description: "Assets with expired or expiring warranties.", icon: ShieldAlert, accent: "warning" },
  { id: "by-branch", label: "Assets by Branch", description: "Inventory grouped by branch.", icon: Building2, accent: "primary" },
  { id: "transfers", label: "Transfer Logs", description: "Audit log of transfers.", icon: ArrowLeftRight, accent: "info" },
] as const;

export default function Reports() {
  const [reportId, setReportId] = useState<string>("warranty");
  const [branchFilter, setBranchFilter] = useState("all");
  const { data: branchRes } = useGetBranchesQuery();
  const branches = branchRes?.data || [];
  const handleExport = (kind: string) => toast.success(`Exporting as ${kind}…`);

  return (
    <>
      <PageHeader title="Reports" description="Generate and export operational reports." />
      <div className="pt-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((r) => {
            const active = reportId === r.id;
            const am: Record<string, string> = { primary: "bg-primary-soft text-primary", warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info" };
            return (
              <button key={r.id} onClick={() => setReportId(r.id)} className={`text-left rounded-xl border bg-surface p-5 shadow-elegant transition-all hover:shadow-elevated ${active ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                <div className={`h-10 w-10 rounded-xl ${am[r.accent]} flex items-center justify-center mb-3`}><r.icon className="h-5 w-5" /></div>
                <div className="flex items-center justify-between"><h3 className="font-semibold text-sm">{r.label}</h3><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
                <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
              </button>);
          })}
        </div>
        <Card className="shadow-elegant"><CardContent className="p-5 flex items-end justify-between flex-wrap gap-3">
          <div className="space-y-1.5"><Label className="text-xs uppercase text-muted-foreground">Branch</Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Branches</SelectItem>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("CSV")}><FileSpreadsheet className="h-4 w-4 mr-1.5" />CSV</Button>
            <Button variant="outline" onClick={() => handleExport("PDF")}><FileText className="h-4 w-4 mr-1.5" />PDF</Button>
            <Button onClick={() => handleExport("XLSX")} className="bg-primary text-primary-foreground hover:bg-primary/90"><Download className="h-4 w-4 mr-1.5" />Download</Button>
          </div>
        </CardContent></Card>
        <Card className="shadow-elegant overflow-hidden">
          {reportId === "warranty" && <WarrantyReport />}
          {reportId === "by-branch" && <BranchReport branchFilter={branchFilter} />}
          {reportId === "transfers" && <TransferReport />}
        </Card>
      </div>
    </>
  );
}

function WarrantyReport() {
  const { data: res, isLoading } = useGetExpiringWarrantiesQuery(365);
  const rows = res?.data || [];
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>;
  return (<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
    <th className="px-6 py-3 font-semibold">Asset</th><th className="px-6 py-3 font-semibold">Location</th><th className="px-6 py-3 font-semibold">Expiry</th><th className="px-6 py-3 font-semibold">Days</th>
  </tr></thead><tbody className="divide-y divide-border">{rows.map((a) => (
    <tr key={a.asset_code} className="hover:bg-surface-muted">
      <td className="px-6 py-3.5"><div className="font-medium">{a.name}</div><div className="text-xs text-muted-foreground font-mono">{a.asset_code}</div></td>
      <td className="px-6 py-3.5 text-xs text-muted-foreground">{a.branch_name} · {a.department_name}</td>
      <td className="px-6 py-3.5 text-muted-foreground">{a.warranty_expiry}</td>
      <td className="px-6 py-3.5"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.days_remaining < 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{a.days_remaining < 0 ? "Expired" : `${a.days_remaining}d`}</span></td>
    </tr>))}</tbody></table></div>);
}

function BranchReport({ branchFilter }: { branchFilter: string }) {
  const { data: res, isLoading } = useGetAssetsQuery(branchFilter !== "all" ? { branch_id: branchFilter } : undefined);
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>;
  const rows = res?.data || [];
  const grouped: Record<string, { count: number; active: number; value: number }> = {};
  rows.forEach((a: any) => { const k = a.branch_name || "Unknown"; if (!grouped[k]) grouped[k] = { count: 0, active: 0, value: 0 }; grouped[k].count++; if (a.status === "active") grouped[k].active++; grouped[k].value += Number(a.purchase_cost || 0); });
  return (<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
    <th className="px-6 py-3 font-semibold">Branch</th><th className="px-6 py-3 font-semibold">Count</th><th className="px-6 py-3 font-semibold">Active</th><th className="px-6 py-3 font-semibold">Value</th>
  </tr></thead><tbody className="divide-y divide-border">{Object.entries(grouped).map(([n, d]) => (
    <tr key={n} className="hover:bg-surface-muted"><td className="px-6 py-3.5 font-medium">{n}</td><td className="px-6 py-3.5">{d.count}</td><td className="px-6 py-3.5 text-success font-semibold">{d.active}</td><td className="px-6 py-3.5 font-mono">₹{d.value.toLocaleString()}</td></tr>
  ))}</tbody></table></div>);
}

function TransferReport() {
  const { data: res, isLoading } = useGetTransfersQuery();
  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>;
  const transfers = res?.data || [];
  return (<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
    <th className="px-6 py-3 font-semibold">ID</th><th className="px-6 py-3 font-semibold">Asset</th><th className="px-6 py-3 font-semibold">Route</th><th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Status</th>
  </tr></thead><tbody className="divide-y divide-border">{transfers.map((t: any) => (
    <tr key={t.id} className="hover:bg-surface-muted">
      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">TRF-{t.id}</td>
      <td className="px-6 py-3.5 font-medium">{t.asset_name || t.asset_code}</td>
      <td className="px-6 py-3.5 text-xs text-muted-foreground">{t.from_branch_name} → {t.to_branch_name}</td>
      <td className="px-6 py-3.5 text-muted-foreground">{t.initiated_at?.substring(0, 10)}</td>
      <td className="px-6 py-3.5 capitalize">{t.status?.replace("_", " ")}</td>
    </tr>))}</tbody></table></div>);
}
