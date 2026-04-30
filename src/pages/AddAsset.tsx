import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Tag, Wrench, CalendarDays, Bell, FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useGetBranchesQuery, useGetDepartmentsQuery, useGetCategoriesQuery, useCreateAssetMutation } from "@/store/apiSlice";

export default function AddAsset() {
  const navigate = useNavigate();
  const { data: branchRes } = useGetBranchesQuery();
  const { data: catRes } = useGetCategoriesQuery();
  const [createAsset, { isLoading: saving }] = useCreateAssetMutation();

  const branches = branchRes?.data || [];
  const categories = catRes?.data || [];

  const [branchId, setBranchId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: "", description: "", barcode: "", serial_number: "",
    purchase_date: "", purchase_cost: "", warranty_expiry: "",
    assigned_to: "",
  });

  const { data: deptRes } = useGetDepartmentsQuery(branchId ? Number(branchId) : undefined, { skip: !branchId });
  const departments = deptRes?.data || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createAsset({
        ...form,
        branch_id: Number(branchId),
        department_id: Number(deptId),
        category_id: Number(categoryId),
        purchase_cost: form.purchase_cost ? Number(form.purchase_cost) : null,
      }).unwrap();
      toast.success("Asset Added Successfully", { description: `${form.name || "Asset"} has been registered.` });
      navigate("/assets/registry");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create asset");
    }
  }

  return (
    <>
      <PageHeader title="Add Asset" description="Register a new asset into the inventory with full lifecycle details." />
      <form onSubmit={handleSubmit} className="pt-6 pb-24 max-w-5xl space-y-5">
        <Section icon={MapPin} title="Location" subtitle="Where is this asset placed?" accent="primary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Branch" required>
              <Select value={branchId} onValueChange={(v) => { setBranchId(v); setDeptId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Department" required>
              <Select value={deptId} onValueChange={setDeptId} disabled={!branchId}>
                <SelectTrigger><SelectValue placeholder={branchId ? "Select department" : "Select branch first"} /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Assigned To">
              <Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="e.g. Dr. Arun Patel" />
            </Field>
          </div>
        </Section>

        <Section icon={Tag} title="Asset Info" subtitle="Identify the asset" accent="accent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Category" required>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Asset Name" required>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Philips MRI Scanner" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description…" />
              </Field>
            </div>
          </div>
        </Section>

        <Section icon={Wrench} title="Product Details" subtitle="Manufacturer & identification" accent="info">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Barcode"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="e.g. BAR001MRI2024" /></Field>
            <Field label="Serial Number"><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} placeholder="e.g. SN-PHI-MRI-78234" /></Field>
            <Field label="Value (₹)"><Input type="number" value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })} placeholder="0" /></Field>
          </div>
        </Section>

        <Section icon={CalendarDays} title="Dates" subtitle="Critical lifecycle dates" accent="warning" highlight>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Purchase Date"><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></Field>
            <Field label="Warranty Expiry" required>
              <Input type="date" required value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} className="border-warning/40 focus-visible:ring-warning/40" />
            </Field>
          </div>
        </Section>

        <Section icon={Bell} title="Alerts" subtitle="Configure proactive notifications" accent="warning">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-muted">
            <div><div className="text-sm font-medium">Enable Alert</div><div className="text-xs text-muted-foreground">Notify staff when warranty is approaching expiry.</div></div>
            <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
          </div>
        </Section>

        <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur border-t border-border px-6 py-3 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Saving…</> : <><Save className="h-4 w-4 mr-1.5" />Save Asset</>}
          </Button>
        </div>
      </form>
    </>
  );
}

function Section({ icon: Icon, title, subtitle, children, accent, highlight }: {
  icon: any; title: string; subtitle?: string; children: React.ReactNode;
  accent: "primary" | "accent" | "info" | "warning" | "neutral"; highlight?: boolean;
}) {
  const accentMap: Record<string, string> = { primary: "bg-primary-soft text-primary", accent: "bg-accent-soft text-accent", info: "bg-info-soft text-info", warning: "bg-warning-soft text-warning", neutral: "bg-neutral-soft text-neutral" };
  return (
    <Card className={`shadow-elegant ${highlight ? "ring-1 ring-warning/30" : ""}`}>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className={`h-10 w-10 rounded-xl ${accentMap[accent]} flex items-center justify-center`}><Icon className="h-5 w-5" /></div>
        <div><CardTitle className="text-base">{title}</CardTitle>{subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}</div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (<div className="space-y-1.5"><Label className="text-xs font-medium text-foreground">{label} {required && <span className="text-danger">*</span>}</Label>{children}</div>);
}
