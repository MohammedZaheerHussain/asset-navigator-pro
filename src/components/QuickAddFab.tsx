import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useGetBranchesQuery, useGetDepartmentsQuery, useGetCategoriesQuery, useCreateAssetMutation } from "@/store/apiSlice";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");

  const { data: branchRes } = useGetBranchesQuery();
  const { data: catRes } = useGetCategoriesQuery();
  const { data: deptRes } = useGetDepartmentsQuery(branchId ? Number(branchId) : undefined, { skip: !branchId });
  const [createAsset, { isLoading }] = useCreateAssetMutation();

  const branches = branchRes?.data || [];
  const categories = catRes?.data || [];
  const departments = deptRes?.data || [];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAsset({
        name,
        branch_id: Number(branchId),
        department_id: Number(deptId),
        category_id: Number(categoryId),
        serial_number: serial,
      }).unwrap();
      setOpen(false);
      toast.success("Asset Added", { description: `${name || "New asset"} registered.` });
      setBranchId(""); setDeptId(""); setCategoryId(""); setName(""); setSerial("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to add asset");
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={cn("fixed bottom-6 right-6 z-40 h-14 px-5 rounded-full bg-gradient-primary text-primary-foreground",
          "flex items-center gap-2 font-semibold text-sm shadow-glow hover:scale-105 transition-transform")}
        aria-label="Quick add asset">
        <Plus className="h-5 w-5" /><span className="hidden sm:inline">Quick Add Asset</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Quick Add Asset</DialogTitle><DialogDescription>Register a new asset with essential details.</DialogDescription></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Branch</Label>
                <Select value={branchId} onValueChange={(v) => { setBranchId(v); setDeptId(""); }}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Department</Label>
                <Select value={deptId} onValueChange={setDeptId} disabled={!branchId}><SelectTrigger><SelectValue placeholder={branchId ? "Select dept" : "Branch first"} /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Asset Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. MRI Scanner" /></div>
              <div className="space-y-1.5 col-span-2"><Label>Serial Number</Label><Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="e.g. SN-PHI-MRI-78234" /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">{isLoading ? "Saving…" : "Save Asset"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
