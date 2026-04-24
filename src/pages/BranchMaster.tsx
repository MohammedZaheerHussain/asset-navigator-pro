import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Pencil, Trash2, Plus, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { branches as initial, type Branch } from "@/lib/mock-data";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

export default function BranchMaster() {
  const [rows, setRows] = useState<Branch[]>(initial);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ code: "", name: "", alias: "" });

  function openAdd() { setEditing(null); setForm({ code: "", name: "", alias: "" }); setOpen(true); }
  function openEdit(b: Branch) { setEditing(b); setForm({ code: b.code, name: b.name, alias: b.alias }); setOpen(true); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...form } : x)));
      toast.success("Branch updated");
    } else {
      setRows((r) => [...r, { id: `b${Date.now()}`, ...form }]);
      toast.success("Branch added");
    }
    setOpen(false);
  }

  function handleDelete(id: string) {
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success("Branch deleted");
  }

  const filtered = rows.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Branch Master"
        description="Manage hospital branches across your network."
        actions={<Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1.5" />Add Branch</Button>}
      />
      <div className="pt-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search branches…" className="pl-9 bg-surface" />
        </div>

        <Card className="shadow-elegant overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Building2} title="No branches found" description="Get started by registering your first hospital branch." actionLabel="Add Branch" onAction={openAdd} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Branch Code</th>
                    <th className="px-6 py-3 font-semibold">Branch Name</th>
                    <th className="px-6 py-3 font-semibold">Alias</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{b.code}</td>
                      <td className="px-6 py-3.5 font-medium">{b.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{b.alias}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>
            <DialogDescription>{editing ? "Update branch details." : "Register a new hospital branch."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Branch Code</Label>
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SNHRC-MN" />
            </div>
            <div className="space-y-1.5">
              <Label>Branch Name</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. SNHRC Main Hospital" />
            </div>
            <div className="space-y-1.5">
              <Label>Alias</Label>
              <Input required value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="e.g. Main" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editing ? "Save Changes" : "Add Branch"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
