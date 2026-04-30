import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Search,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  type UserRow,
  type CreateUserPayload,
  type UpdateUserPayload,
  getUser,
} from "@/store/apiSlice";

// ─── Main Component ──────────────────────────────────────────────

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const currentUser = getUser();

  const { data: usersRes, isLoading, error } = useGetUsersQuery({
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [toggleStatus] = useToggleUserStatusMutation();

  const users = usersRes?.data ?? [];

  // ─── Handlers ──────────────────────────────────────────────────

  async function handleCreate(data: CreateUserPayload) {
    try {
      const res = await createUser(data).unwrap();
      if (res.success) {
        toast.success("User created successfully");
        setShowForm(false);
      } else {
        toast.error(res.message || "Failed to create user");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create user");
    }
  }

  async function handleUpdate(id: number, data: UpdateUserPayload) {
    try {
      const res = await updateUser({ id, data }).unwrap();
      if (res.success) {
        toast.success("User updated");
        setEditingUser(null);
        setShowForm(false);
      } else {
        toast.error(res.message || "Failed to update user");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update user");
    }
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`Deactivate ${user.full_name}? They won't be able to login.`)) return;
    try {
      const res = await deleteUser(user.id).unwrap();
      if (res.success) toast.success("User deactivated");
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to deactivate");
    }
  }

  async function handleToggle(user: UserRow) {
    const newStatus = user.is_active ? "inactive" : "active";
    try {
      const res = await toggleStatus({ id: user.id, status: newStatus }).unwrap();
      if (res.success) toast.success(`User ${newStatus === "active" ? "activated" : "deactivated"}`);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  }

  // ─── Stats ────────────────────────────────────────────────────

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeCount = users.filter((u) => u.is_active).length;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage system users, roles, and access permissions."
      />

      <div className="pt-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Total Users" value={totalUsers} accent="primary" />
          <StatCard icon={ShieldCheck} label="Admins" value={adminCount} accent="info" />
          <StatCard icon={CheckCircle2} label="Active" value={activeCount} accent="success" />
        </div>

        {/* Actions Row */}
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {/* Add User */}
              <Button
                onClick={() => { setEditingUser(null); setShowForm(true); }}
                className="bg-gradient-primary text-primary-foreground shadow-glow"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="shadow-elegant">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-primary" />
              System Users ({totalUsers})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-destructive gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load users</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-3 px-3 font-semibold text-muted-foreground">User</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Email</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Role</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Status</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground">Last Login</th>
                      <th className="py-3 px-3 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-surface-muted/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                              user.role === "admin"
                                ? "bg-primary-soft text-primary"
                                : "bg-info-soft text-info"
                            }`}>
                              {user.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {user.email}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className={
                            user.role === "admin"
                              ? "border-primary/30 text-primary bg-primary-soft"
                              : "border-info/30 text-info bg-info-soft"
                          }>
                            {user.role === "admin" ? <ShieldCheck className="h-3 w-3 mr-1" /> : <Shield className="h-3 w-3 mr-1" />}
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className={
                            user.is_active
                              ? "border-success/30 text-success bg-success-soft"
                              : "border-destructive/30 text-destructive bg-danger-soft"
                          }>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {user.last_login ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(user.last_login).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">Never</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(user)}
                              disabled={user.id === currentUser?.id}
                              title={user.is_active ? "Deactivate" : "Activate"}
                              className="h-8 w-8 p-0"
                            >
                              {user.is_active
                                ? <ToggleRight className="h-4 w-4 text-success" />
                                : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                              }
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingUser(user); setShowForm(true); }}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4 text-info" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              disabled={user.id === currentUser?.id}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>

      {/* ── Create/Edit Dialog ─────────────────────────────── */}
      <UserFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        user={editingUser}
        onSubmit={(data) => {
          if (editingUser) {
            handleUpdate(editingUser.id, data as UpdateUserPayload);
          } else {
            handleCreate(data as CreateUserPayload);
          }
        }}
        isLoading={creating || updating}
      />
    </>
  );
}

// ─── User Form Dialog ─────────────────────────────────────────────

function UserFormDialog({
  open, onClose, user, onSubmit, isLoading,
}: {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "staff" as "admin" | "staff",
    phone: "",
  });

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && user) {
      setForm({
        username: user.username,
        email: user.email,
        password: "",
        full_name: user.full_name,
        role: user.role,
        phone: user.phone || "",
      });
    } else if (isOpen) {
      setForm({ username: "", email: "", password: "", full_name: "", role: "staff", phone: "" });
    }
    if (!isOpen) onClose();
  };

  // Trigger form reset when `open` changes
  if (open) handleOpenChange(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEdit) {
      const updateData: any = {};
      if (form.username !== user!.username) updateData.username = form.username;
      if (form.email !== user!.email) updateData.email = form.email;
      if (form.full_name !== user!.full_name) updateData.full_name = form.full_name;
      if (form.role !== user!.role) updateData.role = form.role;
      if (form.phone !== (user!.phone || "")) updateData.phone = form.phone;
      if (form.password) updateData.password = form.password;
      onSubmit(updateData);
    } else {
      if (!form.username || !form.email || !form.password || !form.full_name) {
        toast.error("Please fill all required fields");
        return;
      }
      onSubmit(form);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Dr. Arun Patel"
                required={!isEdit}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Username *</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="arun.patel"
                required={!isEdit}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="arun@snhrc.org"
              required={!isEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{isEdit ? "New Password (leave blank to keep)" : "Password *"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={isEdit ? "••••••" : "Min 6 characters"}
              required={!isEdit}
              minLength={6}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-primary text-primary-foreground"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Users; label: string; value: number;
  accent: "primary" | "info" | "success";
}) {
  const classes = {
    primary: "bg-primary-soft text-primary",
    info: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
  };
  return (
    <Card className="shadow-elegant">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${classes[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
