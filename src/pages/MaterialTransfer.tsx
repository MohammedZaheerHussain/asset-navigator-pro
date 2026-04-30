import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeftRight, Send, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useGetBranchesQuery, useGetDepartmentsQuery, useGetAssetsQuery,
  useGetTransfersQuery, useCreateTransferMutation,
} from "@/store/apiSlice";

const statusBadge: Record<string, string> = {
  completed: "bg-success-soft text-success border-success/20",
  in_transit: "bg-info-soft text-info border-info/20",
  pending: "bg-warning-soft text-warning border-warning/30",
  cancelled: "bg-danger-soft text-danger border-danger/20",
};
const statusLabel: Record<string, string> = { completed: "Completed", in_transit: "In Transit", pending: "Pending", cancelled: "Cancelled" };

export default function MaterialTransfer() {
  const { data: branchRes } = useGetBranchesQuery();
  const { data: transferRes, isLoading: loadingTransfers } = useGetTransfersQuery();
  const [createTransfer, { isLoading: submitting }] = useCreateTransferMutation();

  const branches = branchRes?.data || [];
  const transfers = transferRes?.data || [];

  const [fromBranch, setFromBranch] = useState("");
  const [fromDept, setFromDept] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [toDept, setToDept] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [reason, setReason] = useState("");

  const { data: fromDeptRes } = useGetDepartmentsQuery(fromBranch ? Number(fromBranch) : undefined, { skip: !fromBranch });
  const { data: toDeptRes } = useGetDepartmentsQuery(toBranch ? Number(toBranch) : undefined, { skip: !toBranch });
  const { data: assetsRes } = useGetAssetsQuery(fromDept ? { department_id: fromDept, status: "active" } : undefined, { skip: !fromDept });

  const fromDepts = fromDeptRes?.data || [];
  const toDepts = toDeptRes?.data || [];
  const availableAssets = assetsRes?.data || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assetCode || !toBranch || !toDept) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await createTransfer({
        asset_code: assetCode,
        to_branch_id: Number(toBranch),
        to_department_id: Number(toDept),
        reason,
      }).unwrap();
      toast.success("Transfer initiated", { description: "The asset has been queued for transfer." });
      setAssetCode(""); setReason("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to initiate transfer");
    }
  }

  return (
    <>
      <PageHeader title="Material Transfer" description="Move assets between branches and departments with full audit trail." />
      <div className="pt-6 space-y-5">
        <Card className="shadow-elegant">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-primary" />Initiate Transfer</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
              <div className="rounded-xl border border-border bg-surface-muted p-4 space-y-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</div>
                <div className="space-y-1.5"><Label>Branch</Label>
                  <Select value={fromBranch} onValueChange={(v) => { setFromBranch(v); setFromDept(""); setAssetCode(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label>Department</Label>
                  <Select value={fromDept} onValueChange={(v) => { setFromDept(v); setAssetCode(""); }} disabled={!fromBranch}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{fromDepts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label>Asset</Label>
                  <Select value={assetCode} onValueChange={setAssetCode} disabled={!fromDept}>
                    <SelectTrigger><SelectValue placeholder={fromDept ? "Select asset" : "Select department first"} /></SelectTrigger>
                    <SelectContent>{availableAssets.map((a: any) => <SelectItem key={a.asset_code} value={a.asset_code}>{a.asset_code} · {a.name}</SelectItem>)}</SelectContent>
                  </Select></div>
              </div>

              <div className="hidden lg:flex items-center justify-center pt-16">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow"><ArrowRight className="h-5 w-5" /></div>
              </div>

              <div className="rounded-xl border border-border bg-primary-soft/50 p-4 space-y-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-wide">To</div>
                <div className="space-y-1.5"><Label>Branch</Label>
                  <Select value={toBranch} onValueChange={(v) => { setToBranch(v); setToDept(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label>Department</Label>
                  <Select value={toDept} onValueChange={setToDept} disabled={!toBranch}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{toDepts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                <div className="space-y-1.5"><Label>Reason / Remarks</Label>
                  <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Replacing decommissioned unit" /></div>
              </div>

              <div className="lg:col-span-3 flex justify-end">
                <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {submitting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Submitting…</> : <><Send className="h-4 w-4 mr-1.5" />Initiate Transfer</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-elegant overflow-hidden">
          <CardHeader><CardTitle className="text-base">Transfer History</CardTitle></CardHeader>
          {loadingTransfers ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
          ) : transfers.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title="No transfers yet" description="Once you initiate a transfer it will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">ID</th><th className="px-6 py-3 font-semibold">Asset</th>
                  <th className="px-6 py-3 font-semibold">From</th><th className="px-6 py-3 font-semibold">To</th>
                  <th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {transfers.map((t: any) => (
                    <tr key={t.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">TRF-{t.id}</td>
                      <td className="px-6 py-3.5 font-medium">{t.asset_name || t.asset_code}<div className="text-xs text-muted-foreground font-normal font-mono">{t.asset_code}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{t.from_branch_name}<div>{t.from_department_name}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{t.to_branch_name}<div>{t.to_department_name}</div></td>
                      <td className="px-6 py-3.5 text-muted-foreground">{t.initiated_at?.substring(0, 10)}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", statusBadge[t.status] || "")}>{statusLabel[t.status] || t.status}</span>
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
