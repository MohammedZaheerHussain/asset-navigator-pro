import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package, Activity, ShieldAlert, ArrowLeftRight, TrendingUp, Clock, Loader2, Wrench,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import {
  useGetDashboardStatsQuery,
  useGetAssetsByCategoryQuery,
  useGetAssetsByBranchQuery,
  useGetRecentActivityQuery,
  useGetExpiringWarrantiesQuery,
} from "@/store/apiSlice";

const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--info))",
  "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--neutral))",
  "#8884d8", "#82ca9d", "#ffc658", "#ff7300",
];

export default function Dashboard() {
  const { data: statsRes, isLoading: loadingStats, error: statsErr } = useGetDashboardStatsQuery();
  const { data: catRes } = useGetAssetsByCategoryQuery();
  const { data: branchRes } = useGetAssetsByBranchQuery();
  const { data: actRes } = useGetRecentActivityQuery(5);
  const { data: warRes } = useGetExpiringWarrantiesQuery(90);

  const loading = loadingStats;
  const stats = statsRes?.data;
  const byCategory = (catRes?.data || []).map((c) => ({ name: c.category, value: Number(c.count) }));
  const byBranch = (branchRes?.data || []).map((b) => ({ name: b.branch.replace("SNHRC ", ""), count: Number(b.count) }));
  const activity = actRes?.data || [];
  const watchlist = warRes?.data || [];

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Real-time overview of your hospital asset network." />
        <div className="pt-6 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading dashboard…</p>
          </div>
        </div>
      </>
    );
  }

  if (statsErr) {
    return (
      <>
        <PageHeader title="Dashboard" description="Real-time overview of your hospital asset network." />
        <div className="pt-6 flex items-center justify-center min-h-[400px]">
          <Card className="shadow-elegant max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-danger-soft text-danger flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-base">Failed to load dashboard</h3>
              <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const total = stats?.total_assets ?? 0;
  const active = stats?.active_assets ?? 0;
  const expiring = stats?.expiring_warranties ?? 0;
  const inTransfer = stats?.assets_in_transfer ?? 0;

  function formatAction(action: string): string {
    return action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
  function timeAgo(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <>
      <PageHeader title="Dashboard" description="Real-time overview of your hospital asset network."
        actions={<><Button variant="outline" asChild><Link to="/reports">View Reports</Link></Button>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90"><Link to="/assets/add">+ Add Asset</Link></Button></>}
      />
      <div className="pt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Assets" value={total} icon={Package} accent="primary" trend={`${active} active`} />
          <KpiCard label="Active Assets" value={active} icon={Activity} accent="success" trend={total > 0 ? `${Math.round(active / total * 100)}% of fleet` : "—"} />
          <KpiCard label="Expiring Warranties" value={expiring} icon={ShieldAlert} accent="warning" trend={expiring > 0 ? "Action required" : "All good"} />
          <KpiCard label="In Transfer" value={inTransfer} icon={ArrowLeftRight} accent="info" trend={`${stats?.maintenance_assets ?? 0} in maintenance`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 shadow-elegant">
            <CardHeader><CardTitle className="text-base">Assets by Category</CardTitle></CardHeader>
            <CardContent>
              {byCategory.length > 0 ? (<>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie><Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                  {byCategory.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate">{c.name}</span><span className="ml-auto font-semibold">{c.value}</span>
                    </div>
                  ))}
                </div>
              </>) : <p className="text-sm text-muted-foreground text-center py-8">No category data</p>}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-elegant">
            <CardHeader><CardTitle className="text-base">Assets by Branch</CardTitle></CardHeader>
            <CardContent>
              {byBranch.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byBranch}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Assets" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground text-center py-8">No branch data</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-elegant">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-warning" />Warranty Watchlist</CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/assets/registry">View all</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {watchlist.length > 0 ? watchlist.slice(0, 5).map((w) => (
                  <div key={w.asset_code} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-surface-muted transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{w.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{w.asset_code} · {w.branch_name} / {w.department_name}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${w.days_remaining <= 7 ? "bg-red-100 text-red-700" : w.days_remaining <= 30 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {w.days_remaining}d left
                    </span>
                  </div>
                )) : <div className="px-6 py-8 text-center text-sm text-muted-foreground">No expiring warranties in the next 90 days</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-accent" />Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activity.length > 0 ? activity.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 px-6 py-3 hover:bg-surface-muted transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      {act.action.includes("transfer") ? <ArrowLeftRight className="h-4 w-4" /> : act.action.includes("status") ? <Wrench className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm"><span className="font-medium">{formatAction(act.action)}</span><span className="text-muted-foreground"> · {act.asset_code}</span></div>
                      <div className="text-xs text-muted-foreground">{act.performed_by} · {timeAgo(act.timestamp)}</div>
                    </div>
                  </div>
                )) : <div className="px-6 py-8 text-center text-sm text-muted-foreground">No recent activity</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, icon: Icon, accent, trend }: { label: string; value: number; icon: any; accent: "primary" | "success" | "warning" | "info"; trend?: string }) {
  const accentMap = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info" };
  return (
    <Card className="shadow-elegant hover:shadow-elevated transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="text-3xl font-bold tracking-tight mt-2">{value.toLocaleString()}</div>
            {trend && <div className="text-xs text-muted-foreground mt-1">{trend}</div>}
          </div>
          <div className={`h-10 w-10 rounded-xl ${accentMap[accent]} flex items-center justify-center`}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}
