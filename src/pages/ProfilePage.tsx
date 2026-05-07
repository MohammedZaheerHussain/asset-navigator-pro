import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation, getUser } from "@/store/apiSlice";
import { User, Mail, Phone, ShieldCheck, KeyRound, Save, Loader2, Clock, BadgeCheck } from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const localUser = getUser();
  const { data: profileRes, isLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: changingPwd }] = useChangePasswordMutation();

  const profile = profileRes?.data;

  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwdError, setPwdError] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || "", email: profile.email || "", phone: profile.phone || "" });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ full_name: form.full_name, email: form.email, phone: form.phone }).unwrap();
      toast({ title: "Profile updated", description: "Your profile has been saved." });
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Failed to update profile", variant: "destructive" });
    }
  };

  const handleChangePassword = async () => {
    setPwdError("");
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      setPwdError("New passwords do not match");
      return;
    }
    if (pwdForm.new_password.length < 6) {
      setPwdError("Password must be at least 6 characters");
      return;
    }
    try {
      await changePassword({ current_password: pwdForm.current_password, new_password: pwdForm.new_password }).unwrap();
      toast({ title: "Password changed", description: "Your password has been updated. Please log in again." });
      setPwdForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e: any) {
      setPwdError(e.data?.message || "Failed to change password");
    }
  };

  const initials = (profile?.full_name || localUser?.full_name || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const roleColor = (profile?.role || localUser?.role) === "admin" ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-blue-100 text-blue-800 border-blue-300";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User className="h-6 w-6 text-primary" /> My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account information and security</p>
      </div>

      {/* Avatar + Identity Card */}
      <Card>
        <CardContent className="p-6 flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold truncate">{profile?.full_name || localUser?.full_name}</div>
            <div className="text-sm text-muted-foreground">{profile?.email || localUser?.email}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 border text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleColor}`}>
                <BadgeCheck className="h-3 w-3" />
                {(profile?.role || localUser?.role) === "admin" ? "System Administrator" : "Staff"}
              </span>
              {profile?.last_login && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last login: {new Date(profile.last_login).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Personal Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your full name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 xxxxx xxxxx" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Username</Label>
            <Input value={profile?.username || ""} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Username cannot be changed</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Current Password</Label>
            <Input type="password" value={pwdForm.current_password} onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>New Password</Label>
              <Input type="password" value={pwdForm.new_password} onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })} placeholder="Min 6 characters" />
            </div>
            <div className="grid gap-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={pwdForm.confirm_password} onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })} placeholder="Repeat new password" />
            </div>
          </div>
          {pwdError && <p className="text-sm text-destructive">{pwdError}</p>}
          <Button onClick={handleChangePassword} disabled={changingPwd || !pwdForm.current_password || !pwdForm.new_password} variant="outline" className="w-full sm:w-auto">
            {changingPwd ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
