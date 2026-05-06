/**
 * Reports Module — Multi-User Report Management
 *
 * Features:
 * - Report list with filters (type, branch, department)
 * - Create / Edit reports with validation
 * - Update history timeline with audit trail
 * - Optimistic locking (conflict detection)
 * - Role-based UI restrictions
 */

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileBarChart2, Plus, Search, Filter, Edit3, Trash2, Clock,
  User, Building2, Layers, Package, Beaker, MoreHorizontal,
  CheckCircle2, AlertCircle, History, X, Save, Loader2,
  ArrowUpDown, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

// ─── Types ────────────────────────────────────────────────────
interface Report {
  id: number;
  report_type: "material" | "acid" | "other";
  title: string;
  branch_id: number;
  department_id: number;
  total_quantity: number;
  unit: string;
  remarks: string | null;
  status: string;
  branch_name: string;
  department_name: string;
  updated_by_name: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface HistoryEntry {
  id: number;
  change_type: string;
  previous_value: any;
  new_value: any;
  change_summary: string;
  user_name: string;
  user_role: string;
  created_at: string;
}

interface Branch { id: number; name: string; }
interface Department { id: number; name: string; }

const API = "http://localhost:8000/api";
const UNITS = ["kg", "liters", "units", "pieces", "meters", "bottles", "packets", "boxes"];
const REPORT_TYPES = [
  { value: "material", label: "Material", icon: Package, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "acid", label: "Acid", icon: Beaker, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-purple-600 bg-purple-50 border-purple-200" },
];

function getToken() {
  return localStorage.getItem("snhrc_token") || "";
}

function getUserRole(): string {
  try {
    const user = JSON.parse(localStorage.getItem("snhrc_user") || "null");
    return user?.role || "staff";
  } catch { return "staff"; }
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  return res.json();
}

// ─── Main Component ───────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({ material: 0, acid: 0, other: 0 });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [searchQ, setSearchQ] = useState("");

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [showHistory, setShowHistory] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isAdmin = getUserRole() === "admin";

  // ─── Fetch Reports ─────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));
    if (filterType) params.set("report_type", filterType);
    if (filterBranch) params.set("branch_id", filterBranch);
    if (filterDept) params.set("department_id", filterDept);
    if (searchQ) params.set("search", searchQ);

    const res = await apiFetch(`/reports?${params}`);
    if (res.success !== false) {
      setReports(res.data || []);
      setTotal(res.pagination?.total || 0);
    }
    setLoading(false);
  }, [page, filterType, filterBranch, filterDept, searchQ]);

  // ─── Fetch Master Data + Type Counts ────────────
  const fetchTypeCounts = useCallback(async () => {
    const res = await apiFetch("/reports?per_page=100");
    const all: Report[] = res.data || [];
    setTypeCounts({
      material: all.filter(r => r.report_type === 'material').length,
      acid: all.filter(r => r.report_type === 'acid').length,
      other: all.filter(r => r.report_type === 'other').length,
    });
  }, []);

  useEffect(() => {
    apiFetch("/branches").then(r => setBranches(r.data || []));
    apiFetch("/departments").then(r => setDepartments(r.data || []));
    fetchTypeCounts();
  }, [fetchTypeCounts]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ─── Fetch History ─────────────────────────────
  const openHistory = async (reportId: number) => {
    setShowHistory(reportId);
    setHistoryLoading(true);
    const res = await apiFetch(`/reports/${reportId}/history`);
    setHistoryData(res.data?.history || []);
    setHistoryLoading(false);
  };

  // ─── Delete Report ─────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm("Archive this report? It can be restored later.")) return;
    await apiFetch(`/reports/${id}`, { method: "DELETE" });
    fetchReports();
    fetchTypeCounts();
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Manage operational reports — material availability, acid inventory, and more."
      />

      <div className="pt-6 space-y-5 max-w-6xl">
        {/* ── Report Type Cards ────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REPORT_TYPES.map((rt) => {
            const count = typeCounts[rt.value] || 0;
            const Icon = rt.icon;
            return (
              <button
                key={rt.value}
                onClick={() => setFilterType(filterType === rt.value ? "" : rt.value)}
                className={cn(
                  "relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left",
                  filterType === rt.value
                    ? cn(rt.color, "shadow-md scale-[1.02]")
                    : "bg-white border-border hover:border-primary/30 hover:shadow-sm"
                )}
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", filterType === rt.value ? "bg-white/60" : "bg-muted")}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">{rt.label}</p>
                  <p className="text-xs text-muted-foreground">{count} report{count !== 1 ? "s" : ""}</p>
                </div>
                {filterType === rt.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="h-5 w-5 text-current" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Filters Bar ──────────────────────────── */}
        <Card className="shadow-elegant">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setPage(1); }}
                  className="pl-9 h-10"
                />
              </div>
              <select
                value={filterBranch}
                onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }}
                className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select
                value={filterDept}
                onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
                className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {isAdmin && (
                <Button
                  onClick={() => { setEditingReport(null); setShowForm(true); }}
                  className="h-10 bg-gradient-primary text-primary-foreground shadow-glow gap-2"
                >
                  <Plus className="h-4 w-4" /> New Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Reports Table ────────────────────────── */}
        <Card className="shadow-elegant overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={FileBarChart2}
                  title="No reports found"
                  description="Adjust your filters or create a new report."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Report</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                      <th className="text-right px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Updated</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reports.map((report) => {
                      const typeConf = REPORT_TYPES.find(t => t.value === report.report_type) || REPORT_TYPES[2];
                      const TypeIcon = typeConf.icon;
                      return (
                        <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{report.title}</p>
                              {report.remarks && (
                                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">{report.remarks}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className={cn("text-[10px] uppercase gap-1 font-semibold", typeConf.color)}>
                              <TypeIcon className="h-3 w-3" />
                              {typeConf.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs">
                              <p className="font-medium text-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {report.branch_name}
                              </p>
                              <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Layers className="h-3 w-3" />
                                {report.department_name}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-base font-bold text-foreground">
                              {Number(report.total_quantity).toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">{report.unit}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-xs">
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(report.updated_at).toLocaleDateString()}
                              </p>
                              {report.updated_by_name && (
                                <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <User className="h-3 w-3" />
                                  {report.updated_by_name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openHistory(report.id)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                title="View History"
                              >
                                <History className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => { setEditingReport(report); setShowForm(true); }}
                                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="h-4 w-4 text-blue-600" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(report.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="Archive"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/10">
                <span className="text-xs text-muted-foreground">
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm" disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-medium px-2">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline" size="sm" disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Report Form Modal ──────────────────────── */}
      {showForm && (
        <ReportFormModal
          report={editingReport}
          branches={branches}
          departments={departments}
          onClose={() => { setShowForm(false); setEditingReport(null); }}
          onSaved={() => { setShowForm(false); setEditingReport(null); fetchReports(); fetchTypeCounts(); }}
        />
      )}

      {/* ── History Modal ──────────────────────────── */}
      {showHistory !== null && (
        <HistoryModal
          reportId={showHistory}
          history={historyData}
          loading={historyLoading}
          onClose={() => setShowHistory(null)}
        />
      )}
    </>
  );
}

// ─── Report Form Modal ────────────────────────────────────────
function ReportFormModal({
  report,
  branches,
  departments,
  onClose,
  onSaved,
}: {
  report: Report | null;
  branches: Branch[];
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!report;
  const [form, setForm] = useState({
    title: report?.title || "",
    report_type: report?.report_type || "material",
    branch_id: report?.branch_id?.toString() || "",
    department_id: report?.department_id?.toString() || "",
    total_quantity: report?.total_quantity?.toString() || "",
    unit: report?.unit || "units",
    remarks: report?.remarks || "",
    expected_updated_at: report?.updated_at || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = isEdit ? `/reports/${report!.id}` : "/reports";
    const method = isEdit ? "PUT" : "POST";

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify({
        ...form,
        total_quantity: parseFloat(form.total_quantity),
        branch_id: parseInt(form.branch_id),
        department_id: parseInt(form.department_id),
      }),
    });

    if (res.success === false) {
      if (res.status === 409) {
        setError("⚠️ Conflict: This report was modified by another user. Please close and try again.");
      } else {
        setError(res.message || res.errors?.join(", ") || "Failed to save");
      }
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">{isEdit ? "Edit Report" : "New Report"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required className="mt-1" />
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Report Type</label>
              <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))} className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm" required>
                {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</label>
              <select value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))} className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm" required disabled={isEdit}>
                <option value="">Select...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</label>
              <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm" required disabled={isEdit}>
                <option value="">Select...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</label>
              <Input type="number" step="0.01" min="0" value={form.total_quantity} onChange={e => setForm(f => ({ ...f, total_quantity: e.target.value }))} required className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background text-sm">
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-gradient-primary text-primary-foreground shadow-glow gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? "Update Report" : "Create Report"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── History Modal ────────────────────────────────────────────
function HistoryModal({
  reportId,
  history,
  loading,
  onClose,
}: {
  reportId: number;
  history: HistoryEntry[];
  loading: boolean;
  onClose: () => void;
}) {
  const typeConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    create:  { icon: CheckCircle2, color: "text-success",  bg: "border-success bg-success-soft" },
    update:  { icon: Edit3,       color: "text-info",     bg: "border-info bg-info-soft" },
    archive: { icon: Trash2,      color: "text-danger",   bg: "border-danger bg-danger-soft" },
    restore: { icon: CheckCircle2, color: "text-success",  bg: "border-success bg-success-soft" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Update History</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No update history available.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[17px] top-0 bottom-0 w-px bg-border" />
              {history.map((entry) => {
                const config = typeConfig[entry.change_type] || typeConfig.update;
                const Icon = config.icon;
                return (
                  <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
                    <div className={cn("relative z-10 flex-shrink-0 h-9 w-9 rounded-full border-2 flex items-center justify-center", config.bg)}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div className="flex-1 bg-muted/30 rounded-xl p-3.5">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {entry.change_type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{entry.change_summary}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.user_name} ({entry.user_role})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
