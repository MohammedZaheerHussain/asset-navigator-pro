import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetRecentActivityQuery } from "@/store/apiSlice";
import { Activity, Search, Filter, RefreshCw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-50 text-emerald-700 border-emerald-200",
  updated: "bg-blue-50 text-blue-700 border-blue-200",
  deleted: "bg-red-50 text-red-700 border-red-200",
  transferred: "bg-purple-50 text-purple-700 border-purple-200",
  approved: "bg-teal-50 text-teal-700 border-teal-200",
  rejected: "bg-orange-50 text-orange-700 border-orange-200",
  serviced: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

export default function AuditLog() {
  const { data: activityRes, isLoading, refetch } = useGetRecentActivityQuery(200);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const activities = activityRes?.data || [];

  const filtered = activities.filter((a: any) => {
    const matchSearch = !search || a.asset_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.performed_by?.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(a.details || {}).toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || a.action?.toLowerCase().includes(actionFilter);

    let matchDate = true;
    if (dateFilter !== "all" && a.timestamp) {
      const ts = new Date(a.timestamp);
      const now = new Date();
      if (dateFilter === "today") {
        matchDate = ts.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        matchDate = ts >= weekAgo;
      } else if (dateFilter === "month") {
        matchDate = ts.getMonth() === now.getMonth() && ts.getFullYear() === now.getFullYear();
      }
    }

    return matchSearch && matchAction && matchDate;
  });

  const actionBadgeClass = (action: string) => {
    const key = Object.keys(ACTION_COLORS).find((k) => action?.toLowerCase().includes(k));
    return key ? ACTION_COLORS[key] : "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-600" /> Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track all system activities and changes across the platform</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ACTION_COLORS).slice(0, 4).map(([action, colorClass]) => (
          <Card key={action}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground capitalize">{action}</p>
              <p className="text-2xl font-bold">
                {activities.filter((a: any) => a.action?.toLowerCase().includes(action)).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by asset, user, or details..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {Object.keys(ACTION_COLORS).map((a) => (
              <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Any Time" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Log Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Timestamp</th>
                  <th className="text-left p-3 font-semibold">Asset</th>
                  <th className="text-left p-3 font-semibold">Action</th>
                  <th className="text-left p-3 font-semibold">Details</th>
                  <th className="text-left p-3 font-semibold">Performed By</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No activity records found</td></tr>
                ) : filtered.map((a: any, i: number) => (
                  <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {a.timestamp ? new Date(a.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs font-semibold text-primary">{a.asset_code || "—"}</span>
                    </td>
                    <td className="p-3">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", actionBadgeClass(a.action))}>
                        {a.action}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <span className="text-xs text-muted-foreground truncate block">
                        {typeof a.details === "string" ? a.details : JSON.stringify(a.details)?.slice(0, 80)}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-medium">{a.performed_by || "System"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="p-3 border-t text-xs text-muted-foreground text-right">
              Showing {filtered.length} of {activities.length} records
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
