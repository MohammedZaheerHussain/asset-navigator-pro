import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation,
  useDeleteUserMutation, useToggleUserStatusMutation, getUser,
  type UserRow, type CreateUserPayload,
} from "@/store/apiSlice";
import {
  Users, Plus, Search, Pencil, Trash2, Loader2, ShieldCheck,
  UserCheck, UserX, BadgeCheck, Crown, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUserManagement() {
  const { toast } = useToast();
  const currentUser = getUser();
  const { data: usersRes, isLoading, refetch } = useGetUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();

  const users: UserRow[] = usersRes?.data || [];

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserRow | null>(null);

  const emptyForm = { username: "", email: "", full_name: "", password: "", role: "staff" as "admin" | "staff", phone: "" };
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, full_name: u.full_name, password: "", role: u.role, phone: u.phone || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email || (!editUser && (!form.username || !form.password))) {
      toast({ title: "Missing fields", description: "Full name, email, username and password are required", variant: "destructive" });
      return;
    }
    try {
      if (editUser) {
        const payload: any = { full_name: form.full_name, email: form.email, role: form.role, phone: form.phone || undefined };
        if (form.password) payload.password = form.password;
        await updateUser({ id: editUser.id, data: payload }).unwrap();
        toast({ title: "Updated", description: `${form.full_name}'s account updated` });
      } else {
        await createUser(form as CreateUserPayload).unwrap();
        toast({ title: "Created", description: `Account for ${form.full_name} created` });
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Operation failed", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (u: UserRow) => {
    if (u.id === currentUser?.id) {
      toast({ title: "Cannot modify", description: "You cannot deactivate your own account", variant: "destructive" });
      return;
    }
    try {
      await toggleStatus({ id: u.id, status: u.is_active ? "inactive" : "active" }).unwrap();
      toast({ title: u.is_active ? "Deactivated" : "Activated", description: `${u.full_name} is now ${u.is_active ? "inactive" : "active"}` });
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteUser(deleteConfirm.id).unwrap();
      toast({ title: "Deleted", description: `${deleteConfirm.full_name}'s account has been removed` });
      setDeleteConfirm(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Delete failed", variant: "destructive" });
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    admins: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-600" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage staff accounts and role assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={openCreate} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4 mr-2" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.total, color: "border-l-amber-500" },
          { label: "Active", value: stats.active, color: "border-l-emerald-500" },
          { label: "Admins", value: stats.admins, color: "border-l-purple-500" },
          { label: "Staff", value: stats.staff, color: "border-l-blue-500" },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color}`}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, username or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold">Role</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Last Login</th>
                    <th className="text-center p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No users found</td></tr>
                  ) : filtered.map((u) => (
                    <tr key={u.id} className={cn("border-b hover:bg-muted/30 transition-colors", !u.is_active && "opacity-60")}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold",
                            u.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          )}>
                            {u.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {u.full_name}
                              {u.id === currentUser?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                            <div className="text-xs text-muted-foreground font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                          u.role === "admin" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-800 border-blue-200"
                        )}>
                          {u.role === "admin" ? <Crown className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}
                          {u.role === "admin" ? "Admin" : "Staff"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                          {u.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {u.last_login ? new Date(u.last_login).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never"}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)} className="h-8 w-8" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(u)}
                            className={cn("h-8 w-8", u.is_active ? "text-amber-600 hover:text-amber-800" : "text-emerald-600 hover:text-emerald-800")}
                            title={u.is_active ? "Deactivate" : "Activate"} disabled={u.id === currentUser?.id}>
                            {u.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(u)}
                            className="h-8 w-8 text-destructive hover:text-destructive" title="Delete"
                            disabled={u.id === currentUser?.id}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editUser ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editUser ? "Edit User Account" : "Create New Staff Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Username *</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="jsmith" disabled={!!editUser} className={editUser ? "opacity-60" : ""} />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 xxxxx" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@snhrc.org" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{editUser ? "New Password (leave blank to keep)" : "Password *"}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editUser ? "Leave blank to keep" : "Min 6 characters"} />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "admin" | "staff" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.role === "admin" && (
              <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs flex items-start gap-2 border border-amber-200">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Admin accounts have full access including user management, approval workflows, and deletion rights.</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={creating || updating} className="bg-amber-600 hover:bg-amber-700">
              {(creating || updating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editUser ? "Save Changes" : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-destructive">Delete Account?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{deleteConfirm?.full_name}</strong>'s account? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
