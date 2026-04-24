import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText, ShieldAlert, Building2, ArrowLeftRight, ChevronRight } from "lucide-react";
import { assets, branches, departments, transfers, branchById, deptById } from "@/lib/mock-data";
import { StatusBadge, WarrantyBadge } from "@/components/StatusBadges";
import { toast } from "sonner";

const reportTypes = [
  { id: "warranty", label: "Expiring Warranties", description: "Assets with expired or soon-to-expire warranties.", icon: ShieldAlert, accent: "warning" },
  { id: "by-dept", label: "Assets by Department", description: "Inventory grouped by department across branches.", icon: Building2, accent: "primary" },
  { id: "transfers", label: "Transfer Logs", description: "Audit log of all material transfers.", icon: ArrowLeftRight, accent: "info" },
] as const;

export default function Reports() {
  const [reportId, setReportId] = useState<string>("warranty");
  const [branchFilter, setBranchFilter] = useState("all");

  const handleExport = (kind: string) => toast.success(`Exporting as ${kind}…`, { description: "Your report will be downloaded shortly." });

  return (
    <>
      <PageHeader title="Reports" description="Generate and export operational reports for your asset network." />
      <div className="pt-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((r) => {
            const active = reportId === r.id;
            const accentMap: Record<string, string> = {
              primary: "bg-primary-soft text-primary",
              warning: "bg-warning-soft text-warning",
              info: "bg-info-soft text-info",
            };
            return (
              <button
                key={r.id}
                onClick={() => setReportId(r.id)}
                className={`text-left rounded-xl border bg-surface p-5 shadow-elegant transition-all hover:shadow-elevated hover:-translate-y-0.5 ${active ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
              >
                <div className={`h-10 w-10 rounded-xl ${accentMap[r.accent]} flex items-center justify-center mb-3`}>
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{r.label}</h3>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
              </button>
            );
          })}
        </div>

        <Card className="shadow-elegant">
          <CardContent className="p-5 flex items-end justify-between flex-wrap gap-3">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground tracking-wide">Branch</Label>
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("CSV")}><FileSpreadsheet className="h-4 w-4 mr-1.5" />Export CSV</Button>
              <Button variant="outline" onClick={() => handleExport("PDF")}><FileText className="h-4 w-4 mr-1.5" />Export PDF</Button>
              <Button onClick={() => handleExport("XLSX")} className="bg-primary text-primary-foreground hover:bg-primary/90"><Download className="h-4 w-4 mr-1.5" />Download</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elegant overflow-hidden">
          {reportId === "warranty" && <WarrantyReport branchFilter={branchFilter} />}
          {reportId === "by-dept" && <ByDeptReport branchFilter={branchFilter} />}
          {reportId === "transfers" && <TransferReport />}
        </Card>
      </div>
    </>
  );
}

function WarrantyReport({ branchFilter }: { branchFilter: string }) {
  const rows = assets.filter((a) =>
    a.warrantyStatus !== "valid" && (branchFilter === "all" || a.branchId === branchFilter)
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-6 py-3 font-semibold">Asset</th>
            <th className="px-6 py-3 font-semibold">Location</th>
            <th className="px-6 py-3 font-semibold">Expiry</th>
            <th className="px-6 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-surface-muted">
              <td className="px-6 py-3.5"><div className="font-medium">{a.name}</div><div className="text-xs text-muted-foreground font-mono">{a.id}</div></td>
              <td className="px-6 py-3.5 text-xs text-muted-foreground">{branchById(a.branchId)?.alias} · {deptById(a.departmentId)?.alias}</td>
              <td className="px-6 py-3.5 text-muted-foreground">{a.warrantyExpiry}</td>
              <td className="px-6 py-3.5"><WarrantyBadge status={a.warrantyStatus} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ByDeptReport({ branchFilter }: { branchFilter: string }) {
  const depts = departments.filter((d) => branchFilter === "all" || d.branchId === branchFilter);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-6 py-3 font-semibold">Department</th>
            <th className="px-6 py-3 font-semibold">Branch</th>
            <th className="px-6 py-3 font-semibold">Asset Count</th>
            <th className="px-6 py-3 font-semibold">Active</th>
            <th className="px-6 py-3 font-semibold">Total Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {depts.map((d) => {
            const list = assets.filter((a) => a.departmentId === d.id);
            const value = list.reduce((s, a) => s + a.value, 0);
            const active = list.filter((a) => a.status === "active").length;
            return (
              <tr key={d.id} className="hover:bg-surface-muted">
                <td className="px-6 py-3.5 font-medium">{d.name}</td>
                <td className="px-6 py-3.5 text-muted-foreground">{branchById(d.branchId)?.name}</td>
                <td className="px-6 py-3.5">{list.length}</td>
                <td className="px-6 py-3.5"><span className="text-success font-semibold">{active}</span></td>
                <td className="px-6 py-3.5 font-mono">${value.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TransferReport() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-6 py-3 font-semibold">ID</th>
            <th className="px-6 py-3 font-semibold">Asset</th>
            <th className="px-6 py-3 font-semibold">From → To</th>
            <th className="px-6 py-3 font-semibold">Date</th>
            <th className="px-6 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transfers.map((t) => (
            <tr key={t.id} className="hover:bg-surface-muted">
              <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{t.id}</td>
              <td className="px-6 py-3.5 font-medium">{t.assetName}</td>
              <td className="px-6 py-3.5 text-xs text-muted-foreground">{t.fromBranch} / {t.fromDept} → {t.toBranch} / {t.toDept}</td>
              <td className="px-6 py-3.5 text-muted-foreground">{t.date}</td>
              <td className="px-6 py-3.5 capitalize">{t.status.replace("_", " ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
