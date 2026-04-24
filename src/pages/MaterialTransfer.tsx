import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeftRight, Send } from "lucide-react";
import { assets, branches, departments, transfers as initialTransfers } from "@/lib/mock-data";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusBadge = {
  completed: "bg-success-soft text-success border-success/20",
  in_transit: "bg-info-soft text-info border-info/20",
  pending: "bg-warning-soft text-warning border-warning/30",
};
const statusLabel = { completed: "Completed", in_transit: "In Transit", pending: "Pending" };

export default function MaterialTransfer() {
  const [fromBranch, setFromBranch] = useState("");
  const [fromDept, setFromDept] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [toDept, setToDept] = useState("");
  const [assetId, setAssetId] = useState("");
  const [history] = useState(initialTransfers);

  const fromDepts = departments.filter((d) => d.branchId === fromBranch);
  const toDepts = departments.filter((d) => d.branchId === toBranch);
  const availableAssets = fromDept ? assets.filter((a) => a.departmentId === fromDept) : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Transfer initiated", { description: "The asset has been queued for transfer." });
    setAssetId("");
  }

  return (
    <>
      <PageHeader title="Material Transfer" description="Move assets between branches and departments with full audit trail." />
      <div className="pt-6 space-y-5">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-primary" />Initiate Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</div>
                <div className="space-y-1.5">
                  <Label>Branch</Label>
                  <Select value={fromBranch} onValueChange={(v) => { setFromBranch(v); setFromDept(""); setAssetId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={fromDept} onValueChange={(v) => { setFromDept(v); setAssetId(""); }} disabled={!fromBranch}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{fromDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Asset</Label>
                  <Select value={assetId} onValueChange={setAssetId} disabled={!fromDept}>
                    <SelectTrigger><SelectValue placeholder={fromDept ? "Select asset" : "Select department first"} /></SelectTrigger>
                    <SelectContent>{availableAssets.map((a) => <SelectItem key={a.id} value={a.id}>{a.id} · {a.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center pt-16">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-primary-soft/50 p-4 space-y-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-wide">To</div>
                <div className="space-y-1.5">
                  <Label>Branch</Label>
                  <Select value={toBranch} onValueChange={(v) => { setToBranch(v); setToDept(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={toDept} onValueChange={setToDept} disabled={!toBranch}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{toDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Reason / Remarks</Label>
                  <Textarea rows={2} placeholder="e.g. Replacing decommissioned unit" />
                </div>
              </div>

              <div className="lg:col-span-3 flex justify-end">
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Send className="h-4 w-4 mr-1.5" />Initiate Transfer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-elegant overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Transfer History</CardTitle>
          </CardHeader>
          {history.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title="No transfers yet" description="Once you initiate a transfer it will appear here for audit." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Transfer ID</th>
                    <th className="px-6 py-3 font-semibold">Asset</th>
                    <th className="px-6 py-3 font-semibold">From</th>
                    <th className="px-6 py-3 font-semibold">To</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{t.id}</td>
                      <td className="px-6 py-3.5 font-medium">{t.assetName}<div className="text-xs text-muted-foreground font-normal font-mono">{t.assetId}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{t.fromBranch}<div>{t.fromDept}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{t.toBranch}<div>{t.toDept}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground">{t.date}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", statusBadge[t.status])}>
                          {statusLabel[t.status]}
                        </span>
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
