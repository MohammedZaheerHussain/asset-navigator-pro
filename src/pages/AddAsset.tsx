import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Tag, Wrench, CalendarDays, Bell, FileText, Save, CheckCircle2 } from "lucide-react";
import { branches, departments, roomsByDept } from "@/lib/mock-data";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/store";
import { addAsset, clearLastCreatedId } from "@/store/assetsSlice";
import { BarcodeDisplay } from "@/components/BarcodeDisplay";

export default function AddAsset() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const lastCreatedId = useAppSelector((s) => s.assets.lastCreatedId);

  const [branchId, setBranchId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState("");
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [serial, setSerial] = useState("");
  const [value, setValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [childAsset, setChildAsset] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const allMaterials = useAppSelector((s) => s.materials.items);
  const categoryItems = useAppSelector((s) => s.categories.items);
  const activeCategories = categoryItems.filter((c) => c.status === "active");

  const filteredDepts = departments.filter((d) => d.branchId === branchId);
  const filteredRooms = deptId ? roomsByDept[deptId] ?? [] : [];
  const filteredMaterials = category ? allMaterials.filter((m) => m.category === category && m.status === "active") : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    dispatch(addAsset({
      name: item || "Untitled Asset",
      category: category,
      branchId,
      departmentId: deptId,
      room,
      make,
      model,
      serial,
      value: parseFloat(value) || 0,
      purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
      warrantyExpiry: warrantyExpiry || "2027-01-01",
      status: "active",
      warrantyStatus: "valid",
      alertEnabled,
    }));

    setShowSuccess(true);
  }

  function handleClose() {
    setShowSuccess(false);
    dispatch(clearLastCreatedId());
    navigate("/assets/registry");
  }

  return (
    <>
      <PageHeader
        title="Add Asset"
        description="Register a new asset into the inventory with full lifecycle details."
      />
      <form onSubmit={handleSubmit} className="pt-6 pb-24 max-w-5xl space-y-5">
        <Section icon={MapPin} title="Location" subtitle="Where is this asset placed?" accent="primary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Branch" required>
              <Select value={branchId} onValueChange={(v) => { setBranchId(v); setDeptId(""); setRoom(""); }}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Department" required>
              <Select value={deptId} onValueChange={(v) => { setDeptId(v); setRoom(""); }} disabled={!branchId}>
                <SelectTrigger><SelectValue placeholder={branchId ? "Select department" : "Select branch first"} /></SelectTrigger>
                <SelectContent>{filteredDepts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Room Number" required>
              <Select value={room} onValueChange={setRoom} disabled={!deptId}>
                <SelectTrigger><SelectValue placeholder={deptId ? "Select room" : "Select department first"} /></SelectTrigger>
                <SelectContent>{filteredRooms.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <Section icon={Tag} title="Asset Info" subtitle="Identify the asset" accent="accent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Category" required>
              <Select value={category} onValueChange={(v) => { setCategory(v); setItem(""); }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{activeCategories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Item Name" required>
              <Select value={item} onValueChange={setItem} disabled={!category}>
                <SelectTrigger><SelectValue placeholder={category ? "Select item" : "Select category first"} /></SelectTrigger>
                <SelectContent>{filteredMaterials.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the asset…" />
              </Field>
            </div>
          </div>
        </Section>

        <Section icon={Wrench} title="Product Details" subtitle="Manufacturer & identification" accent="info">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Make"><Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Philips" /></Field>
            <Field label="Model"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. MX450" /></Field>
            <Field label="Serial Number"><Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="e.g. PHL-948271" /></Field>
            <Field label="Value (USD)"><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" /></Field>
          </div>
        </Section>

        <Section icon={CalendarDays} title="Dates" subtitle="Critical lifecycle dates" accent="warning" highlight>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Purchase Date"><Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></Field>
            <Field label="Issue Date"><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></Field>
            <Field label="Warranty Expiry" required>
              <Input type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} className="border-warning/40 focus-visible:ring-warning/40" />
            </Field>
          </div>
        </Section>

        <Section icon={Bell} title="Alerts" subtitle="Configure proactive notifications" accent="warning">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-muted">
              <div>
                <div className="text-sm font-medium">Enable Alert</div>
                <div className="text-xs text-muted-foreground">Notify staff when warranty is approaching expiry.</div>
              </div>
              <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
            </div>
            {alertEnabled && (
              <Field label="Alert Message">
                <Textarea rows={2} placeholder="e.g. Schedule biomedical inspection 30 days before warranty expiry." />
              </Field>
            )}
          </div>
        </Section>

        <Section icon={FileText} title="Additional" subtitle="Invoice & meta information" accent="neutral">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Invoice / Bill Number"><Input placeholder="e.g. INV-2024-0091" /></Field>
              <Field label="Vendor"><Input placeholder="e.g. MedTech Distributors" /></Field>
            </div>
            <Field label="Remarks"><Textarea rows={2} placeholder="Any additional notes…" /></Field>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-muted">
              <div>
                <div className="text-sm font-medium">Child Asset</div>
                <div className="text-xs text-muted-foreground">Mark this as a sub-component of a parent asset.</div>
              </div>
              <Switch checked={childAsset} onCheckedChange={setChildAsset} />
            </div>
          </div>
        </Section>

        {/* Sticky save bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur border-t border-border px-6 py-3 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="button" variant="ghost">Save as Draft</Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4 mr-1.5" />Save Asset
          </Button>
        </div>
      </form>

      {/* Success Dialog with Barcode */}
      <Dialog open={showSuccess} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center items-center">
            <div className="h-14 w-14 rounded-full bg-success-soft flex items-center justify-center mb-2">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <DialogTitle className="text-xl">Asset Registered Successfully</DialogTitle>
            <DialogDescription>
              A unique barcode has been generated for <span className="font-semibold text-foreground">{lastCreatedId}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {lastCreatedId && <BarcodeDisplay value={lastCreatedId} />}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={handleClose} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Asset Registry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Section({ icon: Icon, title, subtitle, children, accent, highlight }: {
  icon: any; title: string; subtitle?: string; children: React.ReactNode;
  accent: "primary" | "accent" | "info" | "warning" | "neutral"; highlight?: boolean;
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    info: "bg-info-soft text-info",
    warning: "bg-warning-soft text-warning",
    neutral: "bg-neutral-soft text-neutral",
  };
  return (
    <Card className={`shadow-elegant ${highlight ? "ring-1 ring-warning/30" : ""}`}>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className={`h-10 w-10 rounded-xl ${accentMap[accent]} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
    </div>
  );
}
