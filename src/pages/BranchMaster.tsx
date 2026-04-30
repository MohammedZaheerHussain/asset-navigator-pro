import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Pencil, Plus, Search, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { useGetBranchesQuery, useCreateBranchMutation, useUpdateBranchMutation, type Branch } from "@/store/apiSlice";

export default function BranchMaster() {
  const { data: res, isLoading } = useGetBranchesQuery();
  const [createBranch, { isLoading: creating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: updating }] = useUpdateBranchMutation();

  const rows = res?.data || [];

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ code: "", name: "", address: "", city: "", state: "", contact_phone: "", contact_email: "" });

  function openAdd() {
    setEditing(null);
    setForm({ code: "", name: "", address: "", city: "", state: "", contact_phone: "", contact_email: "" });
    setOpen(true);
  }
  function openEdit(b: Branch) {
    setEditing(b);
    setForm({ code: b.code, name: b.name, address: b.address || "", city: b.city || "", state: b.state || "", contact_phone: b.contact_phone || "", contact_email: b.contact_email || "" });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateBranch({ id: editing.id, data: form }).unwrap();
        toast.success("Branch updated");
      } else {
        await createBranch(form).unwrap();
        toast.success("Branch added");
      }
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save branch");
    }
  }

  const filtered = rows.filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader title="Branch Master" description="Manage hospital branches across your network."
        actions={<Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1.5" />Add Branch</Button>} />
      <div className="pt-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search branches…" className="pl-9 bg-surface" />
        </div>
        <Card className="shadow-elegant overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 text-primary animate-spin" /><span className="ml-2 text-sm text-muted-foreground">Loading…</span></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Building2} title="No branches found" description="Get started by registering your first hospital branch." actionLabel="Add Branch" onAction={openAdd} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Branch Code</th><th className="px-6 py-3 font-semibold">Branch Name</th>
                  <th className="px-6 py-3 font-semibold">City</th><th className="px-6 py-3 font-semibold">Departments</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{b.code}</td>
                      <td className="px-6 py-3.5 font-medium">{b.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{b.city || "—"}</td>
                      <td className="px-6 py-3.5"><span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-soft text-primary">{b.department_count ?? 0}</span></td>
                      <td className="px-6 py-3.5 text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button></td>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle><DialogDescription>{editing ? "Update branch details." : "Register a new hospital branch."}</DialogDescription></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Branch Code</Label><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SNHRC-MAIN" /></div>
              <div className="space-y-1.5"><Label>Branch Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. SNHRC Main Hospital" /></div>
            </div>
            <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. 123 Temple Road" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Chennai" /></div>
              <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Tamil Nadu" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating || updating} className="bg-primary text-primary-foreground hover:bg-primary/90">{creating || updating ? "Saving…" : editing ? "Save Changes" : "Add Branch"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
