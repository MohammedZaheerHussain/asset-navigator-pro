import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Pencil, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import {
  useGetBranchesQuery, useGetDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation,
  type Department,
} from "@/store/apiSlice";

export default function DepartmentMaster() {
  const { data: branchRes } = useGetBranchesQuery();
  const { data: deptRes, isLoading } = useGetDepartmentsQuery();
  const [createDept, { isLoading: creating }] = useCreateDepartmentMutation();
  const [updateDept, { isLoading: updating }] = useUpdateDepartmentMutation();

  const branches = branchRes?.data || [];
  const rows = deptRes?.data || [];

  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ branch_id: "", code: "", name: "", head_name: "" });

  function openAdd() { setEditing(null); setForm({ branch_id: branchFilter !== "all" ? branchFilter : "", code: "", name: "", head_name: "" }); setOpen(true); }
  function openEdit(d: Department) { setEditing(d); setForm({ branch_id: String(d.branch_id), code: d.code, name: d.name, head_name: d.head_name || "" }); setOpen(true); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, branch_id: Number(form.branch_id) };
      if (editing) {
        await updateDept({ id: editing.id, data: payload }).unwrap();
        toast.success("Department updated");
      } else {
        await createDept(payload).unwrap();
        toast.success("Department added");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save department");
    }
  }

  function getBranchName(branchId: number): string {
    return branches.find((b) => b.id === branchId)?.name || "Unknown";
  }

  const filtered = rows.filter((d) => branchFilter === "all" || String(d.branch_id) === branchFilter);

  return (
    <>
      <PageHeader title="Department Master" description="Manage departments within each branch."
        actions={<Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1.5" />Add Department</Button>} />
      <div className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Branch</Label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-64 bg-surface"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-elegant overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 text-primary animate-spin" /><span className="ml-2 text-sm text-muted-foreground">Loading…</span></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Layers} title="No departments found" description="No departments exist for this branch yet." actionLabel="Add Department" onAction={openAdd} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Code</th><th className="px-6 py-3 font-semibold">Department</th>
                  <th className="px-6 py-3 font-semibold">Head</th><th className="px-6 py-3 font-semibold">Branch</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{d.code}</td>
                      <td className="px-6 py-3.5 font-medium">{d.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{d.head_name || "—"}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{d.branch_name || getBranchName(d.branch_id)}</td>
                      <td className="px-6 py-3.5 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle><DialogDescription>{editing ? "Update department details." : "Register a new department."}</DialogDescription></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5"><Label>Branch</Label>
              <Select value={form.branch_id} onValueChange={(v) => setForm({ ...form, branch_id: v })}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Dept Code</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. ICU" /></div>
              <div className="space-y-1.5"><Label>Head Name</Label><Input value={form.head_name} onChange={(e) => setForm({ ...form, head_name: e.target.value })} placeholder="e.g. Dr. Mehta" /></div>
            </div>
            <div className="space-y-1.5"><Label>Department Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Intensive Care Unit" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating || updating} className="bg-primary text-primary-foreground hover:bg-primary/90">{creating || updating ? "Saving…" : editing ? "Save Changes" : "Add Department"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
