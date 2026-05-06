import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { svcGet, svcPost, svcPut } from "@/lib/service-api";
import {
  Gavel, Plus, Loader2, Clock, CheckCircle, XCircle, AlertTriangle, Search,
} from "lucide-react";

type CondemnationReq = {
  id: number;
  asset_code: string;
  asset_name?: string;
  reason: string;
  reason_category: string;
  status: string;
  purchase_cost: number;
  current_book_value: number;
  total_service_cost: number;
  service_cost_ratio: number;
  requested_by_name?: string;
  reviewed_by_name?: string;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
};

type Asset = { asset_code: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50",
  approved: "text-emerald-600 bg-emerald-50",
  rejected: "text-red-600 bg-red-50",
  deferred: "text-blue-600 bg-blue-50",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  deferred: AlertTriangle,
};

export default function CondemnationPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CondemnationReq[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<CondemnationReq | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    asset_code: "", reason: "", reason_category: "beyond_repair",
  });
  const [reviewForm, setReviewForm] = useState({
    status: "approved", review_notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, assetsRes] = await Promise.all([
        svcGet("/condemnation"),
        svcGet("/assets"),
      ]);
      setRequests(reqRes.data || []);
      setAssets((assetsRes.data || []).map((a: any) => ({ asset_code: a.asset_code, name: a.name })));
    } catch (e) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.asset_code || !form.reason) {
      toast({ title: "Required", description: "Asset and reason are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await svcPost("/condemnation", form);
      toast({ title: "Submitted", description: "Condemnation request submitted for review" });
      setCreateOpen(false);
      setForm({ asset_code: "", reason: "", reason_category: "beyond_repair" });
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to submit", variant: "destructive" });
    }
    setSaving(false);
  };

  const openReview = (r: CondemnationReq) => {
    setReviewTarget(r);
    setReviewForm({ status: "approved", review_notes: "" });
    setReviewOpen(true);
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    setSaving(true);
    try {
      await svcPut(`/condemnation/${reviewTarget.id}/review`, reviewForm);
      toast({ title: "Reviewed", description: `Request ${reviewForm.status}` });
      setReviewOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Review failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const pending = requests.filter((r) => r.status === "pending").length;
  const approved = requests.filter((r) => r.status === "approved").length;

  const filtered = requests.filter((r) =>
    !search ||
    r.asset_code.toLowerCase().includes(search.toLowerCase()) ||
    (r.asset_name || "").toLowerCase().includes(search.toLowerCase()) ||
    r.reason.toLowerCase().includes(search.toLowerCase())
  );

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
            <Gavel className="h-6 w-6 text-cyan-600" />
            Condemnation Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Submit and review asset condemnation requests with approval workflow
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" /> Request Condemnation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{approved}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{requests.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search condemnation requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No condemnation requests found.
            </CardContent>
          </Card>
        ) : (
          filtered.map((r) => {
            const Icon = STATUS_ICONS[r.status] || Clock;
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{r.asset_name || r.asset_code}</span>
                        <span className="text-xs text-muted-foreground">{r.asset_code}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status]}`}>
                          <Icon className="h-3 w-3" />
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.reason}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Purchase: ₹{Number(r.purchase_cost).toLocaleString("en-IN")}</span>
                        <span>Book: ₹{Number(r.current_book_value).toLocaleString("en-IN")}</span>
                        <span>Service: ₹{Number(r.total_service_cost).toLocaleString("en-IN")}</span>
                        <span className="font-semibold">Ratio: {r.service_cost_ratio}%</span>
                      </div>
                      {r.review_notes && (
                        <p className="text-xs mt-1 italic text-muted-foreground">Review: {r.review_notes}</p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => openReview(r)}>
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Request Asset Condemnation</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Asset *</Label>
              <Select value={form.asset_code} onValueChange={(v) => setForm({ ...form, asset_code: v })}>
                <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                <SelectContent>
                  {assets.map((a) => (
                    <SelectItem key={a.asset_code} value={a.asset_code}>{a.asset_code} — {a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Reason Category</Label>
              <Select value={form.reason_category} onValueChange={(v) => setForm({ ...form, reason_category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beyond_repair">Beyond Repair</SelectItem>
                  <SelectItem value="obsolete">Obsolete Technology</SelectItem>
                  <SelectItem value="excessive_cost">Excessive Service Cost</SelectItem>
                  <SelectItem value="safety_hazard">Safety Hazard</SelectItem>
                  <SelectItem value="end_of_life">End of Life</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Reason / Justification *</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Detailed reason for condemning this asset..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader><DialogTitle>Review Condemnation Request</DialogTitle></DialogHeader>
          {reviewTarget && (
            <div className="grid gap-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p><strong>{reviewTarget.asset_name}</strong> ({reviewTarget.asset_code})</p>
                <p className="text-muted-foreground mt-1">{reviewTarget.reason}</p>
              </div>
              <div className="grid gap-2">
                <Label>Decision</Label>
                <Select value={reviewForm.status} onValueChange={(v) => setReviewForm({ ...reviewForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">✅ Approve</SelectItem>
                    <SelectItem value="rejected">❌ Reject</SelectItem>
                    <SelectItem value="deferred">⏳ Defer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Review Notes</Label>
                <Textarea value={reviewForm.review_notes} onChange={(e) => setReviewForm({ ...reviewForm, review_notes: e.target.value })} placeholder="Optional notes..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleReview} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
