import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { svcGet, svcPost, svcPut, svcDelete } from "@/lib/service-api";
import {
  Wrench, Plus, Search, Calendar, IndianRupee, Filter,
  AlertTriangle, CheckCircle, Clock, Loader2, Pencil, Trash2,
} from "lucide-react";

type ServiceRecord = {
  id: number;
  asset_code: string;
  asset_name?: string;
  service_type: string;
  service_date: string;
  description: string;
  vendor_name?: string;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  total_cost_display?: string;
  parts_replaced?: string;
  next_service_date?: string;
  performed_by?: string;
  logged_by_name?: string;
  notes?: string;
  purchase_cost?: number;
  created_at: string;
};

type DashboardStats = {
  total_records: number;
  total_cost: number;
  assets_serviced: number;
  preventive_count: number;
  corrective_count: number;
  calibration_count: number;
};

type Asset = {
  asset_code: string;
  name: string;
};

const SERVICE_TYPES = [
  { value: "corrective", label: "Corrective", color: "text-red-600 bg-red-50" },
  { value: "preventive", label: "Preventive", color: "text-emerald-600 bg-emerald-50" },
  { value: "calibration", label: "Calibration", color: "text-blue-600 bg-blue-50" },
  { value: "inspection", label: "Inspection", color: "text-amber-600 bg-amber-50" },
];

export default function ServiceLog() {
  const { toast } = useToast();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    asset_code: "", service_type: "corrective", service_date: new Date().toISOString().split("T")[0],
    description: "", vendor_name: "", labor_cost: "0", parts_cost: "0",
    parts_replaced: "", next_service_date: "", performed_by: "", notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, statsRes, assetsRes] = await Promise.all([
        svcGet("/services"),
        svcGet("/services/dashboard"),
        svcGet("/assets?per_page=500"),
      ]);
      setRecords(svcRes.data || []);
      setStats(statsRes.data || null);
      setAssets((assetsRes.data || []).map((a: any) => ({ asset_code: a.asset_code, name: a.name })));
    } catch (e) {
      toast({ title: "Error", description: "Failed to load service data", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: ServiceRecord) => {
    setEditId(r.id);
    setForm({
      asset_code: r.asset_code, service_type: r.service_type,
      service_date: r.service_date, description: r.description,
      vendor_name: r.vendor_name || "", labor_cost: String(r.labor_cost),
      parts_cost: String(r.parts_cost), parts_replaced: r.parts_replaced || "",
      next_service_date: r.next_service_date || "", performed_by: r.performed_by || "",
      notes: r.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.asset_code || !form.description) {
      toast({ title: "Missing fields", description: "Asset and description are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        labor_cost: parseFloat(form.labor_cost) || 0,
        parts_cost: parseFloat(form.parts_cost) || 0,
      };
      if (editId) {
        await svcPut(`/services/${editId}`, payload);
        toast({ title: "Updated", description: "Service record updated" });
      } else {
        await svcPost("/services", payload);
        toast({ title: "Created", description: "Service record logged successfully" });
      }
      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service record?")) return;
    try {
      await svcDelete(`/services/${id}`);
      toast({ title: "Deleted", description: "Service record removed" });
      fetchData();
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const filtered = records.filter((r) => {
    const matchSearch = !search ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      (r.asset_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.vendor_name || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || r.service_type === filterType;
    return matchSearch && matchType;
  });

  const getTypeBadge = (type: string) => {
    const t = SERVICE_TYPES.find((st) => st.value === type);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${t?.color || "bg-gray-100 text-gray-600"}`}>
        {t?.label || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wrench className="h-6 w-6 text-cyan-600" />
            Service Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all maintenance and repair activities for hospital assets
          </p>
        </div>
        <Button onClick={openCreate} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" /> Log Service
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-cyan-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Services</p>
              <p className="text-2xl font-bold">{stats.total_records}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Cost</p>
              <p className="text-2xl font-bold">₹{Number(stats.total_cost).toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Assets Serviced</p>
              <p className="text-2xl font-bold">{stats.assets_serviced}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Corrective / Preventive</p>
              <p className="text-2xl font-bold">{stats.corrective_count} / {stats.preventive_count}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by asset, description, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SERVICE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Date</th>
                  <th className="text-left p-3 font-semibold">Asset</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Description</th>
                  <th className="text-left p-3 font-semibold">Vendor</th>
                  <th className="text-right p-3 font-semibold">Labor</th>
                  <th className="text-right p-3 font-semibold">Parts</th>
                  <th className="text-right p-3 font-semibold">Total</th>
                  <th className="text-center p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-muted-foreground">
                      {records.length === 0 ? "No service records yet. Click 'Log Service' to add the first one." : "No records match your filter."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(r.service_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{r.asset_name || r.asset_code}</div>
                        <div className="text-xs text-muted-foreground">{r.asset_code}</div>
                      </td>
                      <td className="p-3">{getTypeBadge(r.service_type)}</td>
                      <td className="p-3 max-w-[200px] truncate">{r.description}</td>
                      <td className="p-3 text-muted-foreground">{r.vendor_name || "—"}</td>
                      <td className="p-3 text-right font-mono">₹{Number(r.labor_cost).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-mono">₹{Number(r.parts_cost).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-mono font-semibold">₹{Number(r.total_cost).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="h-8 w-8">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="h-8 w-8 text-red-500 hover:text-red-700">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Service Record" : "Log New Service"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Asset */}
            <div className="grid gap-2">
              <Label>Asset *</Label>
              <Select value={form.asset_code} onValueChange={(v) => setForm({ ...form, asset_code: v })}>
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.asset_code} value={a.asset_code}>
                      {a.asset_code} — {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Service Type</Label>
                <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Service Date</Label>
                <Input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label>Description *</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was done? e.g., Replaced toner cartridge and fuser unit"
                rows={3}
              />
            </div>

            {/* Vendor + Performed By */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Vendor / Service Provider</Label>
                <Input value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} placeholder="e.g., HP Service Center" />
              </div>
              <div className="grid gap-2">
                <Label>Performed By</Label>
                <Input value={form.performed_by} onChange={(e) => setForm({ ...form, performed_by: e.target.value })} placeholder="Technician name" />
              </div>
            </div>

            {/* Costs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Labor Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> Parts Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.parts_cost} onChange={(e) => setForm({ ...form, parts_cost: e.target.value })} />
              </div>
            </div>

            {/* Total preview */}
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total Cost</span>
              <span className="text-lg font-bold text-cyan-700">
                ₹{(parseFloat(form.labor_cost || "0") + parseFloat(form.parts_cost || "0")).toLocaleString("en-IN")}
              </span>
            </div>

            {/* Parts Replaced */}
            <div className="grid gap-2">
              <Label>Parts Replaced</Label>
              <Input value={form.parts_replaced} onChange={(e) => setForm({ ...form, parts_replaced: e.target.value })} placeholder="e.g., Toner, Fuser Unit, Drum" />
            </div>

            {/* Next Service + Notes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Next Service Date</Label>
                <Input type="date" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "Update" : "Log Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
