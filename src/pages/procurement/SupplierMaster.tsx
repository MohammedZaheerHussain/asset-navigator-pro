import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  useGetSuppliersQuery, useGetSupplierStatsQuery,
  useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation,
  type SupplierRow,
} from "@/store/apiSlice";
import {
  Truck, Plus, Search, Pencil, Trash2, Loader2, Star, RefreshCw,
  Phone, Mail, MapPin, Building2, FileText, UserCheck, UserX, Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUPPLIER_TYPES = [
  { value: "medical", label: "Medical" },
  { value: "electrical", label: "Electrical" },
  { value: "furniture", label: "Furniture" },
  { value: "it", label: "IT Equipment" },
  { value: "lab", label: "Lab Equipment" },
  { value: "kitchen", label: "Kitchen" },
  { value: "plumbing", label: "Plumbing" },
  { value: "safety", label: "Safety" },
  { value: "vehicles", label: "Vehicles" },
  { value: "general", label: "General" },
];

const TYPE_COLORS: Record<string, string> = {
  medical: "bg-red-50 text-red-700 border-red-200",
  electrical: "bg-yellow-50 text-yellow-700 border-yellow-200",
  furniture: "bg-amber-50 text-amber-700 border-amber-200",
  it: "bg-blue-50 text-blue-700 border-blue-200",
  lab: "bg-purple-50 text-purple-700 border-purple-200",
  kitchen: "bg-orange-50 text-orange-700 border-orange-200",
  general: "bg-gray-50 text-gray-700 border-gray-200",
};

const emptyForm: Partial<SupplierRow> = {
  supplier_name: "", dealer_name: "", supplier_type: "general",
  contact_person: "", phone: "", alternate_phone: "", email: "",
  address_line1: "", city: "", state: "", pincode: "",
  gst_number: "", pan_number: "", payment_terms: "net30",
  is_preferred: false, remarks: "",
};

export default function SupplierMaster() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: suppliersRes, isLoading, refetch } = useGetSuppliersQuery({ search, type: typeFilter !== "all" ? typeFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined, per_page: 100 });
  const { data: statsRes } = useGetSupplierStatsQuery();
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

  const suppliers: SupplierRow[] = suppliersRes?.data || [];
  const stats = statsRes?.data;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<SupplierRow | null>(null);
  const [form, setForm] = useState<Partial<SupplierRow>>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<SupplierRow | null>(null);

  const openCreate = () => { setEditSupplier(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (s: SupplierRow) => {
    setEditSupplier(s);
    setForm({ ...s });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.supplier_name || !form.supplier_type) {
      toast({ title: "Required", description: "Supplier name and type are required", variant: "destructive" });
      return;
    }
    try {
      if (editSupplier) {
        await updateSupplier({ id: editSupplier.id, data: form }).unwrap();
        toast({ title: "Updated", description: `${form.supplier_name} updated` });
      } else {
        await createSupplier(form).unwrap();
        toast({ title: "Created", description: `Supplier ${form.supplier_name} added` });
      }
      setDialogOpen(false);
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteSupplier(deleteConfirm.id).unwrap();
      toast({ title: "Deactivated", description: `${deleteConfirm.supplier_name} has been deactivated` });
      setDeleteConfirm(null);
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Failed", variant: "destructive" });
    }
  };

  const u = (key: keyof typeof form, val: any) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6 text-teal-600" /> Supplier Master
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage vendors and dealers supplying materials & equipment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={openCreate} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" /> Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Suppliers", value: stats?.total ?? 0, color: "border-l-teal-500" },
          { label: "Active", value: stats?.active ?? 0, color: "border-l-emerald-500" },
          { label: "Preferred", value: stats?.preferred ?? 0, color: "border-l-amber-500" },
          { label: "Types", value: new Set(suppliers.map((s) => s.supplier_type)).size, color: "border-l-blue-500" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SUPPLIER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Supplier</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Contact</th>
                  <th className="text-left p-3 font-semibold">GST</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr></thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No suppliers found. Add your first supplier.</td></tr>
                  ) : suppliers.map((s) => (
                    <tr key={s.id} className={cn("border-b hover:bg-muted/30 transition-colors", !s.is_active && "opacity-50")}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
                            {s.supplier_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {s.supplier_name}
                              {s.is_preferred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{s.supplier_code}</div>
                            {s.dealer_name && <div className="text-xs text-muted-foreground">{s.dealer_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", TYPE_COLORS[s.supplier_type] || TYPE_COLORS.general)}>
                          {s.supplier_type}
                        </span>
                      </td>
                      <td className="p-3">
                        {s.contact_person && <div className="text-xs font-medium">{s.contact_person}</div>}
                        {s.phone && <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</div>}
                        {s.email && <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</div>}
                      </td>
                      <td className="p-3 text-xs font-mono text-muted-foreground">{s.gst_number || "—"}</td>
                      <td className="p-3">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          s.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {s.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(s)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editSupplier ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editSupplier ? "Edit Supplier" : "Add New Supplier"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic Info */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Basic Information
              </h4>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Supplier Name *</Label><Input value={form.supplier_name || ""} onChange={(e) => u("supplier_name", e.target.value)} placeholder="ABC Medical Supplies" /></div>
                  <div className="grid gap-1.5"><Label>Dealer Name</Label><Input value={form.dealer_name || ""} onChange={(e) => u("dealer_name", e.target.value)} placeholder="Regional dealer" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Type *</Label>
                    <Select value={form.supplier_type || "general"} onValueChange={(v) => u("supplier_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SUPPLIER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Payment Terms</Label>
                    <Select value={form.payment_terms || "net30"} onValueChange={(v) => u("payment_terms", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="advance">Advance</SelectItem>
                        <SelectItem value="cod">Cash on Delivery</SelectItem>
                        <SelectItem value="net15">Net 15 Days</SelectItem>
                        <SelectItem value="net30">Net 30 Days</SelectItem>
                        <SelectItem value="net60">Net 60 Days</SelectItem>
                        <SelectItem value="net90">Net 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Contact Details
              </h4>
              <div className="grid gap-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5"><Label>Contact Person</Label><Input value={form.contact_person || ""} onChange={(e) => u("contact_person", e.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => u("phone", e.target.value)} placeholder="+91" /></div>
                  <div className="grid gap-1.5"><Label>Alt. Phone</Label><Input value={form.alternate_phone || ""} onChange={(e) => u("alternate_phone", e.target.value)} /></div>
                </div>
                <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={form.email || ""} onChange={(e) => u("email", e.target.value)} /></div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Address
              </h4>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Address</Label><Input value={form.address_line1 || ""} onChange={(e) => u("address_line1", e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5"><Label>City</Label><Input value={form.city || ""} onChange={(e) => u("city", e.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>State</Label><Input value={form.state || ""} onChange={(e) => u("state", e.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>Pincode</Label><Input value={form.pincode || ""} onChange={(e) => u("pincode", e.target.value)} /></div>
                </div>
              </div>
            </div>

            {/* Business */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Business Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label>GST Number</Label><Input value={form.gst_number || ""} onChange={(e) => u("gst_number", e.target.value)} placeholder="22AAAAA0000A1Z5" /></div>
                <div className="grid gap-1.5"><Label>PAN Number</Label><Input value={form.pan_number || ""} onChange={(e) => u("pan_number", e.target.value)} placeholder="AAAAA0000A" /></div>
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div>
                <Label className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500" /> Preferred Vendor</Label>
                <p className="text-xs text-muted-foreground">Highlight this supplier in purchase recommendations</p>
              </div>
              <Switch checked={!!form.is_preferred} onCheckedChange={(v) => u("is_preferred", v)} />
            </div>

            <div className="grid gap-1.5"><Label>Remarks</Label><Textarea value={form.remarks || ""} onChange={(e) => u("remarks", e.target.value)} placeholder="Any notes about this supplier..." rows={2} /></div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating || updating} className="bg-teal-600 hover:bg-teal-700">
              {(creating || updating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editSupplier ? "Save Changes" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-destructive">Deactivate Supplier?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to deactivate <strong>{deleteConfirm?.supplier_name}</strong>? They won't appear in new purchase entries.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" /> Deactivate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
