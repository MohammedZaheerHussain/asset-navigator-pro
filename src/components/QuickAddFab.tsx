import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { branches, departments } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [category, setCategory] = useState("");
  const [item, setItem] = useState("");

  const categoryItems = useAppSelector((s) => s.categories.items);
  const activeCategories = categoryItems.filter((c) => c.status === "active");
  const allMaterials = useAppSelector((s) => s.materials.items);

  const filteredDepts = departments.filter((d) => d.branchId === branchId);
  const filteredMaterials = category ? allMaterials.filter((m) => m.category === category && m.status === "active") : [];

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    toast.success("Asset Added Successfully", {
      description: `${item || "New asset"} registered to inventory.`,
    });
    setBranchId(""); setDeptId(""); setCategory(""); setItem("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 right-6 z-40 h-14 px-5 rounded-full bg-gradient-primary text-primary-foreground",
          "flex items-center gap-2 font-semibold text-sm shadow-glow hover:scale-105 transition-transform"
        )}
        aria-label="Quick add asset"
      >
        <Plus className="h-5 w-5" />
        <span className="hidden sm:inline">Quick Add Asset</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quick Add Asset</DialogTitle>
            <DialogDescription>Register a new asset with the essential details. Use the full Add Asset page for complete records.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={(v) => { setBranchId(v); setDeptId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={deptId} onValueChange={setDeptId} disabled={!branchId}>
                  <SelectTrigger><SelectValue placeholder={branchId ? "Select department" : "Select branch first"} /></SelectTrigger>
                  <SelectContent>
                    {filteredDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setItem(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Item</Label>
                <Select value={item} onValueChange={setItem} disabled={!category}>
                  <SelectTrigger><SelectValue placeholder={category ? "Select item" : "Select category first"} /></SelectTrigger>
                  <SelectContent>
                    {filteredMaterials.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Serial Number</Label>
                <Input placeholder="e.g. PHL-948271" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Save Asset</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
