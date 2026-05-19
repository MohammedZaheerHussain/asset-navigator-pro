import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  useGetSuppliersQuery, useGetBranchesQuery, useGetDepartmentsQuery, useGetCategoriesQuery,
  useCreatePurchaseMutation, type CreatePurchasePayload,
} from "@/store/apiSlice";
import {
  ShoppingCart, Plus, Trash2, Loader2, FileText, Package, Calculator, Send,
  Save, ChevronRight, Upload, IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ItemRow {
  item_name: string; category_id: number | null; quantity: number;
  unit_price: number; warranty_months: number; serial_prefix: string; notes: string;
}

const emptyItem = (): ItemRow => ({
  item_name: "", category_id: null, quantity: 1, unit_price: 0, warranty_months: 0, serial_prefix: "", notes: "",
});

export default function PurchaseEntry() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: suppliersRes } = useGetSuppliersQuery({ status: "active", per_page: 500 });
  const { data: branchesRes } = useGetBranchesQuery();
  const { data: deptsRes } = useGetDepartmentsQuery();
  const { data: catsRes } = useGetCategoriesQuery();
  const [createPurchase, { isLoading: submitting }] = useCreatePurchaseMutation();

  const suppliers = suppliersRes?.data || [];
  const branches = branchesRes?.data || [];
  const departments = deptsRes?.data || [];
  const categories = catsRes?.data || [];

  // Header state
  const [supplierId, setSupplierId] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [branchId, setBranchId] = useState<string>("");
  const [deptId, setDeptId] = useState<string>("");
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(false);

  // Items
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof ItemRow, val: any) => {
    const copy = [...items];
    (copy[i] as any)[key] = val;
    setItems(copy);
  };

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0), [items]);
  const grandTotal = subtotal + gstAmount - discountAmount;

  const filteredDepts = departments.filter((d: any) => !branchId || d.branch_id === Number(branchId));

  const handleSubmit = async (status: "draft" | "pending") => {
    if (!supplierId || !branchId || items.length === 0 || !items[0].item_name) {
      toast({ title: "Missing fields", description: "Supplier, branch, and at least one item are required", variant: "destructive" });
      return;
    }
    try {
      const payload: CreatePurchasePayload = {
        supplier_id: Number(supplierId),
        purchase_date: purchaseDate,
        receiving_branch_id: Number(branchId),
        receiving_department_id: deptId ? Number(deptId) : undefined,
        invoice_number: invoiceNumber || undefined,
        invoice_date: invoiceDate || undefined,
        gst_amount: gstAmount,
        discount_amount: discountAmount,
        purchase_notes: notes || undefined,
        auto_generate_assets: autoGenerate,
        status,
        items: items.filter((it) => it.item_name).map((it) => ({
          item_name: it.item_name,
          category_id: it.category_id || undefined,
          quantity: it.quantity,
          unit_price: it.unit_price,
          warranty_months: it.warranty_months || undefined,
          serial_prefix: it.serial_prefix || undefined,
          notes: it.notes || undefined,
        })),
      };
      await createPurchase(payload).unwrap();
      toast({
        title: status === "draft" ? "Draft Saved" : "Submitted for Approval",
        description: `Purchase entry with ${items.length} item(s) has been ${status === "draft" ? "saved" : "submitted"}`,
      });
      navigate("/procurement/purchases");
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Failed to create purchase", variant: "destructive" });
    }
  };

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-teal-600" /> New Purchase Entry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Record a new procurement with invoice, items, and auto-asset generation</p>
      </div>

      {/* SECTION 1 — Purchase Header */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> ① Purchase Header</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.supplier_name} ({s.supplier_code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Purchase Date *</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Invoice Number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-2026-001" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label>Invoice Date</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Receiving Branch *</Label>
              <Select value={branchId} onValueChange={(v) => { setBranchId(v); setDeptId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Department</Label>
              <Select value={deptId} onValueChange={setDeptId}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {filteredDepts.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3 — Purchased Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" /> ② Purchased Items</CardTitle>
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5 mr-1" /> Add Row</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold min-w-[200px]">Item Name *</th>
                  <th className="text-left p-3 font-semibold min-w-[140px]">Category</th>
                  <th className="text-center p-3 font-semibold w-[80px]">Qty</th>
                  <th className="text-right p-3 font-semibold w-[120px]">Unit Price (₹)</th>
                  <th className="text-center p-3 font-semibold w-[100px]">Warranty (m)</th>
                  <th className="text-right p-3 font-semibold w-[120px]">Total</th>
                  <th className="text-center p-3 font-semibold w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2"><Input value={item.item_name} onChange={(e) => updateItem(i, "item_name", e.target.value)} placeholder="Wheelchair / Printer / etc." className="h-9" /></td>
                    <td className="p-2">
                      <Select value={item.category_id ? String(item.category_id) : ""} onValueChange={(v) => updateItem(i, "category_id", Number(v))}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-2"><Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="h-9 text-center" min={1} /></td>
                    <td className="p-2"><Input type="number" value={item.unit_price} onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} className="h-9 text-right" min={0} step="0.01" /></td>
                    <td className="p-2"><Input type="number" value={item.warranty_months} onChange={(e) => updateItem(i, "warranty_months", parseInt(e.target.value) || 0)} className="h-9 text-center" min={0} /></td>
                    <td className="p-2 text-right font-semibold text-sm">{fmt(item.quantity * item.unit_price)}</td>
                    <td className="p-2">
                      {items.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 — Asset Generation Toggle */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">③ Auto-Generate Trackable Assets?</Label>
              <p className="text-sm text-muted-foreground mt-1">When approved, each item will automatically create asset entries in the Asset Registry with serial numbers, warranty tracking, and barcodes.</p>
            </div>
            <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} className="scale-125" />
          </div>
          {autoGenerate && (
            <div className="mt-4 p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs">
              <strong>Auto-generation active:</strong> {items.reduce((s, it) => s + (it.quantity || 0), 0)} asset(s) will be created upon approval. Each item row × quantity = individual tracked assets.
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 5 — Financial Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" /> ④ Financial Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-xs ml-auto space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="text-muted-foreground">GST Amount</span>
              <Input type="number" value={gstAmount} onChange={(e) => setGstAmount(parseFloat(e.target.value) || 0)} className="w-28 h-8 text-right" min={0} step="0.01" />
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="text-muted-foreground">Discount</span>
              <Input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)} className="w-28 h-8 text-right" min={0} step="0.01" />
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4" /> Grand Total</span>
              <span className="text-teal-700">{fmt(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6 — Notes */}
      <Card>
        <CardHeader><CardTitle className="text-base">⑤ Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes about this purchase..." rows={3} />
        </CardContent>
      </Card>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border px-6 py-3 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/procurement/purchases")}>Cancel</Button>
        <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={submitting}>
          <Save className="h-4 w-4 mr-2" /> Save Draft
        </Button>
        <Button onClick={() => handleSubmit("pending")} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}
