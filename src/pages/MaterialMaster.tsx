import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Pencil, Trash2, Plus, Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { useGetCategoriesQuery } from "@/store/apiSlice";

// MaterialMaster uses categories from the live API.
// Materials are managed locally since no dedicated /api/materials endpoint exists yet.

const UNITS = ["Pcs", "Set", "Box", "Pair", "Roll", "Kit", "Bottle"];

interface Material {
  id: string; name: string; category: string; unit: string; description: string; status: "active" | "inactive";
}

const emptyForm = { name: "", category: "", unit: "", description: "", status: "active" as const };

export default function MaterialMaster() {
  const { data: catRes } = useGetCategoriesQuery();
  const categories = catRes?.data || [];

  const [rows, setRows] = useState<Material[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(emptyForm);

  function nextId(): string {
    const nums = rows.map((m) => parseInt(m.id.replace("MAT-", ""), 10)).filter(Boolean);
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `MAT-${String(next).padStart(4, "0")}`;
  }

  function openAdd() { setEditing(null); setForm({ ...emptyForm, category: categoryFilter !== "all" ? categoryFilter : "" }); setOpen(true); }
  function openEdit(m: Material) { setEditing(m); setForm({ name: m.name, category: m.category, unit: m.unit, description: m.description, status: m.status }); setOpen(true); }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, ...form } : x)));
      toast.success("Material updated");
    } else {
      setRows((r) => [...r, { id: nextId(), ...form }]);
      toast.success("Material added");
    }
    setOpen(false);
  }

  function handleDelete(id: string) { setRows((r) => r.filter((x) => x.id !== id)); toast.success("Material deleted"); }

  const filtered = useMemo(() => rows.filter((m) => {
    const matchCat = categoryFilter === "all" || m.category === categoryFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [rows, categoryFilter, search]);

  return (
    <>
      <PageHeader title="Material Master" description="Manage the material catalog — all item types available across SNHRC branches."
        actions={<Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1.5" />Add Material</Button>} />
      <div className="pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-52 bg-surface"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials…" className="pl-9 bg-surface" />
          </div>
        </div>

        <Card className="shadow-elegant overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="No materials found" description="Get started by adding your first material." actionLabel="Add Material" onAction={openAdd} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-semibold">Material ID</th><th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Category</th><th className="px-6 py-3 font-semibold">Unit</th>
                  <th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{m.id}</td>
                      <td className="px-6 py-3.5"><div className="font-medium">{m.name}</div>{m.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{m.description}</div>}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{m.category}</td>
                      <td className="px-6 py-3.5 text-muted-foreground">{m.unit}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${m.status === "active" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${m.status === "active" ? "bg-success" : "bg-muted-foreground"}`} />{m.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Material" : "Add Material"}</DialogTitle><DialogDescription>{editing ? `Update ${editing.id}.` : "Register a new material."}</DialogDescription></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1.5"><Label>Material Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Patient Monitor" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{editing ? "Save Changes" : "Add Material"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
