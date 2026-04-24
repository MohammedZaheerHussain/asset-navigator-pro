import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package, Activity, ShieldAlert, ArrowLeftRight, TrendingUp, Clock,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { assets, branches, recentActivity, branchById, deptById } from "@/lib/mock-data";
import { StatusBadge, WarrantyBadge } from "@/components/StatusBadges";
import { Link } from "react-router-dom";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--neutral))",
];

export default function Dashboard() {
  const total = assets.length;
  const active = assets.filter((a) => a.status === "active").length;
  const expiring = assets.filter((a) => a.warrantyStatus !== "valid").length;
  const inTransfer = assets.filter((a) => a.status === "transfer").length;

  const byCategory = Object.entries(
    assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const byBranch = branches.map((b) => ({
    name: b.alias,
    Active: assets.filter((a) => a.branchId === b.id && a.status === "active").length,
    Other: assets.filter((a) => a.branchId === b.id && a.status !== "active").length,
  }));

  const watchlist = assets.filter((a) => a.warrantyStatus !== "valid").slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your hospital asset network."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/reports">View Reports</Link></Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/assets/add">+ Add Asset</Link>
            </Button>
          </>
        }
      />

      <div className="pt-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Assets" value={total} icon={Package} accent="primary" trend="+12 this month" />
          <KpiCard label="Active Assets" value={active} icon={Activity} accent="success" trend={`${Math.round(active/total*100)}% of fleet`} />
          <KpiCard label="Expiring Warranties" value={expiring} icon={ShieldAlert} accent="warning" trend="Action required" />
          <KpiCard label="Assets in Transfer" value={inTransfer} icon={ArrowLeftRight} accent="info" trend="Live transfers" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 shadow-elegant">
            <CardHeader>
              <CardTitle className="text-base">Assets by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                      {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                {byCategory.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto font-semibold">{c.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-elegant">
            <CardHeader>
              <CardTitle className="text-base">Assets by Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byBranch}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Active" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Other" stackId="a" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Watchlist + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-elegant">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning" />
                Warranty Watchlist
              </CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/assets/registry">View all</Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {watchlist.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-surface-muted transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.id} · {branchById(a.branchId)?.alias} / {deptById(a.departmentId)?.alias}
                      </div>
                    </div>
                    <WarrantyBadge status={a.warrantyStatus} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentActivity.map((act) => (
                  <div key={act.id} className="flex items-center gap-3 px-6 py-3 hover:bg-surface-muted transition-colors">
                    <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{act.action}</span>
                        <span className="text-muted-foreground"> · {act.target}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{act.user} · {act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, icon: Icon, accent, trend }: {
  label: string; value: number; icon: any; accent: "primary" | "success" | "warning" | "info"; trend?: string;
}) {
  const accentMap = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  };
  return (
    <Card className="shadow-elegant hover:shadow-elevated transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
            <div className="text-3xl font-bold tracking-tight mt-2">{value.toLocaleString()}</div>
            {trend && <div className="text-xs text-muted-foreground mt-1">{trend}</div>}
          </div>
          <div className={`h-10 w-10 rounded-xl ${accentMap[accent]} flex items-center justify-center`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
