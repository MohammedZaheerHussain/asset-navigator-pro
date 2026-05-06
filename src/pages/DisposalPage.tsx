import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { svcGet, svcPost } from "@/lib/service-api";
import {
  Trash2, Plus, Loader2, IndianRupee, PackageX,
} from "lucide-react";

type Disposal = {
  id: number;
  asset_code: string;
  asset_name?: string;
  condemnation_id: number;
  disposal_method: string;
  disposal_date: string;
  sale_amount: number;
  buyer_name?: string;
  certificate_number?: string;
  notes?: string;
  disposed_by_name?: string;
  created_at: string;
};

type DisposalStats = {
  total_disposals: number;
  total_sale_amount: number;
  methods: Record<string, number>;
};

export default function DisposalPage() {
  const { toast } = useToast();
  const [disposals, setDisposals] = useState<Disposal[]>([]);
  const [stats, setStats] = useState<DisposalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approvedCondemnations, setApprovedCondemnations] = useState<any[]>([]);

  const [form, setForm] = useState({
    asset_code: "", condemnation_id: "", disposal_method: "auction",
    disposal_date: new Date().toISOString().split("T")[0],
    sale_amount: "0", buyer_name: "", certificate_number: "", notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dispRes, statsRes, condRes] = await Promise.all([
        svcGet("/disposal"),
        svcGet("/disposal/stats"),
        svcGet("/condemnation?status=approved"),
      ]);
      setDisposals(dispRes.data || []);
      setStats(statsRes.data || null);
      setApprovedCondemnations(condRes.data || []);
    } catch (e) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.asset_code || !form.condemnation_id) {
      toast({ title: "Required", description: "Asset and condemnation reference are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await svcPost("/disposal", {
        ...form,
        condemnation_id: parseInt(form.condemnation_id),
        sale_amount: parseFloat(form.sale_amount) || 0,
      });
      toast({ title: "Recorded", description: "Disposal recorded successfully" });
      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to record", variant: "destructive" });
    }
    setSaving(false);
  };

  const methodLabel = (m: string) => {
    const map: Record<string, string> = {
      auction: "Auction", buyback: "Buyback", scrap: "Scrapped",
      donation: "Donated", transfer: "Transferred", destroyed: "Destroyed",
    };
    return map[m] || m;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-cyan-600" />
            Asset Disposal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record disposal of condemned assets via auction, scrap, donation, or buyback
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-cyan-600 hover:bg-cyan-700"
          disabled={approvedCondemnations.length === 0}>
          <Plus className="h-4 w-4 mr-2" /> Record Disposal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Disposals</p>
            <p className="text-2xl font-bold">{stats?.total_disposals || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Recovery Amount</p>
            <p className="text-xl font-bold">₹{Number(stats?.total_sale_amount || 0).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Awaiting Disposal</p>
            <p className="text-2xl font-bold text-amber-600">{approvedCondemnations.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Disposal Records */}
      {disposals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <PackageX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium">No Disposals Yet</p>
            <p className="text-sm text-muted-foreground">Record disposals after condemnation requests are approved.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Asset</th>
                    <th className="text-left p-3 font-semibold">Method</th>
                    <th className="text-right p-3 font-semibold">Sale Amount</th>
                    <th className="text-left p-3 font-semibold">Buyer</th>
                    <th className="text-left p-3 font-semibold">Certificate</th>
                    <th className="text-left p-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {disposals.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(d.disposal_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{d.asset_name || d.asset_code}</div>
                        <div className="text-xs text-muted-foreground">{d.asset_code}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700">
                          {methodLabel(d.disposal_method)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">₹{Number(d.sale_amount).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-muted-foreground">{d.buyer_name || "—"}</td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{d.certificate_number || "—"}</td>
                      <td className="p-3 text-muted-foreground max-w-[150px] truncate">{d.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Record Asset Disposal</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Condemned Asset *</Label>
              <Select value={form.condemnation_id} onValueChange={(v) => {
                const c = approvedCondemnations.find((x: any) => String(x.id) === v);
                setForm({ ...form, condemnation_id: v, asset_code: c?.asset_code || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Select condemned asset" /></SelectTrigger>
                <SelectContent>
                  {approvedCondemnations.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.asset_code} — {c.asset_name || "Asset"} (Condemned)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Disposal Method</Label>
                <Select value={form.disposal_method} onValueChange={(v) => setForm({ ...form, disposal_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auction">Auction</SelectItem>
                    <SelectItem value="buyback">Buyback</SelectItem>
                    <SelectItem value="scrap">Scrap</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="destroyed">Destroyed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Disposal Date</Label>
                <Input type="date" value={form.disposal_date} onChange={(e) => setForm({ ...form, disposal_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label><IndianRupee className="h-3 w-3 inline" /> Sale / Recovery Amount</Label>
                <Input type="number" min="0" value={form.sale_amount} onChange={(e) => setForm({ ...form, sale_amount: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Buyer Name</Label>
                <Input value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} placeholder="Buyer or recipient" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Certificate Number</Label>
              <Input value={form.certificate_number} onChange={(e) => setForm({ ...form, certificate_number: e.target.value })} placeholder="Disposal certificate #" />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Record Disposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
