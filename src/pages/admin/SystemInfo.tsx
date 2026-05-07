import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStatsQuery, useGetUsersQuery, getUser } from "@/store/apiSlice";
import { Activity, Database, Users, Cpu, ShieldCheck, Crown, BadgeCheck, UserCheck, UserX, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { svcGet } from "@/lib/service-api";
import { useState, useEffect } from "react";

const RBAC_MATRIX = [
  { feature: "View Assets", admin: true, staff: true },
  { feature: "Add / Edit Assets", admin: true, staff: true },
  { feature: "Delete Assets", admin: true, staff: false },
  { feature: "Log Service Records", admin: true, staff: true },
  { feature: "Approve Condemnation", admin: true, staff: false },
  { feature: "Manage Depreciation Config", admin: true, staff: false },
  { feature: "View Audit Log", admin: true, staff: false },
  { feature: "Manage Users", admin: true, staff: false },
  { feature: "Admin Panel", admin: true, staff: false },
  { feature: "Export Reports", admin: true, staff: true },
];

export default function SystemInfo() {
  const { data: statsRes } = useGetDashboardStatsQuery();
  const { data: usersRes } = useGetUsersQuery();
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const currentUser = getUser();

  const stats = statsRes?.data;
  const users = usersRes?.data || [];

  useEffect(() => {
    svcGet("/health").then((r) => setBackendHealth(r.data)).catch(() => setBackendHealth(null));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Cpu className="h-6 w-6 text-amber-600" /> System Info
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health, system stats, and role permissions</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Backend Health */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> API Health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={cn("text-sm font-semibold flex items-center gap-1",
                backendHealth ? "text-emerald-600" : "text-red-500"
              )}>
                {backendHealth ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {backendHealth ? "Healthy" : "Unreachable"}
              </span>
            </div>
            {backendHealth && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Version</span>
                  <span className="text-sm font-mono">{backendHealth.version || "1.0.0"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Server Time</span>
                  <span className="text-sm font-mono">{backendHealth.time}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">JWT Expiry</span>
              <span className="text-sm font-mono">1 hour (3600s)</span>
            </div>
          </CardContent>
        </Card>

        {/* Asset Stats */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Database Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {stats && [
              { label: "Total Assets", value: stats.total_assets },
              { label: "Active Assets", value: stats.active_assets },
              { label: "In Transfer", value: stats.assets_in_transfer },
              { label: "In Maintenance", value: stats.maintenance_assets },
              { label: "Expiring Warranties (90d)", value: stats.expiring_warranties },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> User Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Total Users", value: users.length, icon: Users, color: "text-amber-600" },
                { label: "Active", value: users.filter((u) => u.is_active).length, icon: UserCheck, color: "text-emerald-600" },
                { label: "Inactive", value: users.filter((u) => !u.is_active).length, icon: UserX, color: "text-red-500" },
                { label: "Admins", value: users.filter((u) => u.role === "admin").length, icon: Crown, color: "text-purple-600" },
                { label: "Staff", value: users.filter((u) => u.role === "staff").length, icon: BadgeCheck, color: "text-blue-600" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Icon className={cn("h-3.5 w-3.5", color)} />{label}</span>
                  <span className="text-sm font-bold">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logged-in Admin Info */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Session Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                {(currentUser?.full_name || "A").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{currentUser?.full_name}</div>
                <div className="text-xs text-muted-foreground">{currentUser?.email}</div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mt-1">
                  <Crown className="h-3 w-3" /> Admin
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">App</span>
              <span className="text-sm font-mono">SNHRC Asset Management v1.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Frontend</span>
              <span className="text-sm font-mono">React + Vite + RTK Query</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Backend</span>
              <span className="text-sm font-mono">PHP + PostgreSQL (Render)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RBAC Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Role-Based Access Control Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Feature</th>
                <th className="text-center p-3 font-semibold">
                  <span className="inline-flex items-center gap-1 text-amber-700"><Crown className="h-3.5 w-3.5" /> Admin</span>
                </th>
                <th className="text-center p-3 font-semibold">
                  <span className="inline-flex items-center gap-1 text-blue-700"><BadgeCheck className="h-3.5 w-3.5" /> Staff</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {RBAC_MATRIX.map((row) => (
                <tr key={row.feature} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium">{row.feature}</td>
                  <td className="p-3 text-center">
                    {row.admin ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {row.staff ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
