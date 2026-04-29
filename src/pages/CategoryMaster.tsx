import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tags, Pencil, Trash2, Plus, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/store";
import { addCategory, updateCategory, deleteCategory, type Category } from "@/store/categoriesSlice";

type FormState = {
  name: string;
  description: string;
  status: "active" | "inactive";
};

const emptyForm: FormState = { name: "", description: "", status: "active" };

export default function CategoryMaster() {
  /* ── RTK store ── */
  const rows = useAppSelector((s) => s.categories.items);
  const dispatch = useAppDispatch();

  /* ── local UI state ── */
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({ name: c.name, description: c.description, status: c.status });
    setOpen(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      dispatch(updateCategory({ id: editing.id, ...form }));
      toast.success("Category updated");
    } else {
      dispatch(addCategory(form));
      toast.success("Category added");
    }
    setOpen(false);
  }

  function handleDelete(id: string, name: string) {
    dispatch(deleteCategory(id));
    toast.success(`Category "${name}" deleted`);
  }

  const filtered = useMemo(() => {
    return rows.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [rows, search]);

  return (
    <>
      <PageHeader
        title="Category Master"
        description="Manage material and asset categories used across the system."
        actions={
          <Button onClick={openAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-1.5" />Add Category
          </Button>
        }
      />

      <div className="pt-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="pl-9 bg-surface"
          />
        </div>

        {/* Table */}
        <Card className="shadow-elegant overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No categories found"
              description="Get started by adding your first category."
              actionLabel="Add Category"
              onAction={openAdd}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">Category ID</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs text-primary font-semibold">{c.id}</td>
                      <td className="px-6 py-3.5 font-medium">{c.name}</td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{c.description}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          c.status === "active"
                            ? "bg-success-soft text-success"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            c.status === "active" ? "bg-success" : "bg-muted-foreground"
                          }`} />
                          {c.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" onClick={() => handleDelete(c.id, c.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Update details for ${editing.id}.`
                : "Add a new category for materials and assets."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category Name</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Laboratory Equipment"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the category…"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editing ? "Save Changes" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
