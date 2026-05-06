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
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/store/apiSlice";
import {
  TrendingDown, Settings, Loader2, IndianRupee, Calendar, Percent,
} from "lucide-react";

type DepConfig = {
  id: number;
  category_id: number;
  category_name: string;
  method: string;
  useful_life_years: number;
  residual_percent: number;
  annual_rate: number | null;
  service_cost_threshold_percent: number;
};

type DepReport = {
  asset_code: string;
  asset_name: string;
  status: string;
  purchase_cost: number;
  current_book_value: number;
  total_service_cost: number;
  service_cost_ratio: number;
  health_status: string;
  years_used: number;
  remaining_life: number;
};

export default function Depreciation() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<DepConfig[]>([]);
  const [report, setReport] = useState<DepReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialog, setConfigDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    category_id: "", method: "SLM", useful_life_years: "10",
    residual_percent: "5", annual_rate: "15", service_cost_threshold_percent: "50",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cfgRes, rptRes, catRes] = await Promise.all([
        apiGet("/depreciation/config"),
        apiGet("/depreciation/report"),
        apiGet("/categories"),
      ]);
      setConfigs(cfgRes.data || []);
      setReport(rptRes.data || []);
      setCategories(catRes.data || []);
    } catch (e) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveConfig = async () => {
    if (!form.category_id) {
      toast({ title: "Required", description: "Select a category", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiPost("/depreciation/config", {
        category_id: parseInt(form.category_id),
        method: form.method,
        useful_life_years: parseInt(form.useful_life_years),
        residual_percent: parseFloat(form.residual_percent),
        annual_rate: form.method === "WDV" ? parseFloat(form.annual_rate) : null,
        service_cost_threshold_percent: parseFloat(form.service_cost_threshold_percent),
      });
      toast({ title: "Saved", description: "Depreciation config updated" });
      setConfigDialog(false);
      fetchData();
    } catch (e) {
      toast({ title: "Error", description: "Failed to save config", variant: "destructive" });
    }
    setSaving(false);
  };

  const healthColor = (h: string) => {
    if (h === "healthy") return "text-emerald-600 bg-emerald-50";
    if (h === "warning") return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const totalOriginal = report.reduce((s, r) => s + r.purchase_cost, 0);
  const totalBook = report.reduce((s, r) => s + r.current_book_value, 0);
  const totalDepreciated = totalOriginal - totalBook;

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
            <TrendingDown className="h-6 w-6 text-cyan-600" />
            Depreciation Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            SLM / WDV depreciation schedules per category with book value tracking
          </p>
        </div>
        <Button onClick={() => setConfigDialog(true)} variant="outline">
          <Settings className="h-4 w-4 mr-2" /> Configure
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Original Value</p>
            <p className="text-xl font-bold">₹{totalOriginal.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Current Book Value</p>
            <p className="text-xl font-bold">₹{totalBook.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Depreciated</p>
            <p className="text-xl font-bold">₹{totalDepreciated.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Configs Set</p>
            <p className="text-xl font-bold">{configs.length} categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Config Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Category Configurations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {configs.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">{c.category_name}</h3>
                  <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">{c.method}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Life: {c.useful_life_years} yrs</span>
                  <span>Residual: {c.residual_percent}%</span>
                  <span>Threshold: {c.service_cost_threshold_percent}%</span>
                  {c.annual_rate && <span>Rate: {c.annual_rate}%</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Depreciation Report Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Asset</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Purchase</th>
                  <th className="text-right p-3 font-semibold">Book Value</th>
                  <th className="text-right p-3 font-semibold">Service Cost</th>
                  <th className="text-center p-3 font-semibold">Ratio</th>
                  <th className="text-center p-3 font-semibold">Years</th>
                  <th className="text-center p-3 font-semibold">Health</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.asset_code} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{r.asset_name}</div>
                      <div className="text-xs text-muted-foreground">{r.asset_code}</div>
                    </td>
                    <td className="p-3 capitalize">{r.status}</td>
                    <td className="p-3 text-right font-mono">₹{r.purchase_cost.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-mono font-semibold">₹{r.current_book_value.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-right font-mono">₹{r.total_service_cost.toLocaleString("en-IN")}</td>
                    <td className="p-3 text-center font-mono">{r.service_cost_ratio}%</td>
                    <td className="p-3 text-center">{r.years_used} / {r.years_used + r.remaining_life}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${healthColor(r.health_status)}`}>
                        {r.health_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={configDialog} onOpenChange={setConfigDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Depreciation Configuration</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SLM">SLM (Straight Line)</SelectItem>
                    <SelectItem value="WDV">WDV (Written Down)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Useful Life (years)</Label>
                <Input type="number" min="1" value={form.useful_life_years} onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Residual %</Label>
                <Input type="number" min="0" max="50" step="0.1" value={form.residual_percent} onChange={(e) => setForm({ ...form, residual_percent: e.target.value })} />
              </div>
              {form.method === "WDV" && (
                <div className="grid gap-2">
                  <Label>Annual Rate %</Label>
                  <Input type="number" min="1" max="100" value={form.annual_rate} onChange={(e) => setForm({ ...form, annual_rate: e.target.value })} />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Service Threshold %</Label>
                <Input type="number" min="10" max="100" value={form.service_cost_threshold_percent} onChange={(e) => setForm({ ...form, service_cost_threshold_percent: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveConfig} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
