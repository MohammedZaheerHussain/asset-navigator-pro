import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Pencil, Trash2, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { branches, departments as initial, type Department, branchById } from "@/lib/mock-data";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

export default function DepartmentMaster() {
  const [rows, setRows] = useState<Department[]>(initial);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ branchId: "", code: "", name: "", alias: "" });

  function openAdd() { setEditing(null); setForm({ branchId: branchFilter !== "all" ? branchFilter : "", code: "", name: "", alias: "" }); setOpen(true); }
  function openEdit(d: Department) { setEditing(d); setForm({ branchId: d.branchId, code: d.code, name: d.name, alias: d.alias }); setOpen(true); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...form } : x)));
      toast.success("Department updated");
    } else {
      setRows((r) => [...r, { id: `d${Date.now()}`, ...form }]);
      toast.success("Department added");
    }
    setOpen(false);
  }
  function handleDelete(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Department deleted");
  }

  const filtered = rows.filter((d) => branchFilter === "all" || d.branchId === branchFilter);

  return (
    <>
      <PageHeader
        title="Department Master"
        description="Manage departments within each branch."
        actions={<Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1.5" />Add Department</Button>}
      />
      <div className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Branch</Label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-64 bg-surface"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-elegant overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Layers} title="No departments found" description="No departments exist for this branch yet." actionLabel="Add Department" onAction={openAdd} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Code</th>
                    <th className="px-6 py-3 font-semibold">Department</th>
                    <th className="px-6 py-3 font-semibold">Alias</th>
                    <th className="px-6 py-3 font-semibold">Branch</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{d.code}</td>
                      <td className="px-6 py-3.5 font-medium">{d.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{d.alias}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{branchById(d.branchId)?.name}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4" /></Button>
                      </td>
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
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle>
            <DialogDescription>{editing ? "Update department details." : "Register a new department under a branch."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department Code</Label>
                <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. ICU" />
              </div>
              <div className="space-y-1.5">
                <Label>Alias</Label>
                <Input required value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="e.g. ICU" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Department Name</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Intensive Care Unit" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editing ? "Save Changes" : "Add Department"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
