import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/store/apiSlice";
import {
  AlertTriangle, Loader2, TrendingUp, ShieldAlert, CircleCheck,
} from "lucide-react";

type FlaggedAsset = {
  asset_code: string;
  asset_name: string;
  status: string;
  purchase_cost: number;
  current_book_value: number;
  total_service_cost: number;
  service_cost_ratio: number;
  threshold_percent: number;
  total_services: number;
};

export default function Evaluation() {
  const { toast } = useToast();
  const [flagged, setFlagged] = useState<FlaggedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiGet("/assets/flagged");
        setFlagged(res.data || []);
      } catch (e) {
        toast({ title: "Error", description: "Failed to load flagged assets", variant: "destructive" });
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          Asset Evaluation — Flagged for Review
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assets where cumulative service costs exceed the threshold relative to book value
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Flagged Assets</p>
            <p className="text-2xl font-bold text-red-600">{flagged.length}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Service Spent</p>
            <p className="text-xl font-bold">₹{flagged.reduce((s, f) => s + f.total_service_cost, 0).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Book Value</p>
            <p className="text-xl font-bold">₹{flagged.reduce((s, f) => s + f.current_book_value, 0).toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Table */}
      {flagged.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CircleCheck className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-lg font-medium">All Clear!</p>
            <p className="text-sm text-muted-foreground">No assets exceed their service cost threshold.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-red-50/50">
                    <th className="text-left p-3 font-semibold">Asset</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-right p-3 font-semibold">Purchase</th>
                    <th className="text-right p-3 font-semibold">Book Value</th>
                    <th className="text-right p-3 font-semibold">Service Cost</th>
                    <th className="text-center p-3 font-semibold">Ratio</th>
                    <th className="text-center p-3 font-semibold">Threshold</th>
                    <th className="text-center p-3 font-semibold">Services</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((f) => (
                    <tr key={f.asset_code} className="border-b hover:bg-red-50/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{f.asset_name}</div>
                        <div className="text-xs text-muted-foreground">{f.asset_code}</div>
                      </td>
                      <td className="p-3 capitalize">{f.status}</td>
                      <td className="p-3 text-right font-mono">₹{f.purchase_cost.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-mono">₹{f.current_book_value.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-mono font-semibold text-red-600">₹{f.total_service_cost.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-red-600">{f.service_cost_ratio}%</span>
                      </td>
                      <td className="p-3 text-center text-muted-foreground">{f.threshold_percent}%</td>
                      <td className="p-3 text-center font-semibold">{f.total_services}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
