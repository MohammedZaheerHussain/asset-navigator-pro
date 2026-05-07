import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Bell, ChevronDown, ShieldCheck, Crown, Settings, User } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useGetExpiringWarrantiesQuery } from "@/store/apiSlice";
import { getUser, logout } from "@/store/apiSlice";
import { useNavigate } from "react-router-dom";

export function AppNavbar() {
  const { data: warRes } = useGetExpiringWarrantiesQuery(90);
  const alerts = warRes?.data?.slice(0, 5) || [];
  const user = getUser();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const initials = user?.full_name
    ? user.full_name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()
    : "AD";

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/90 backdrop-blur border-b border-border flex items-center gap-3 px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <div className="flex-1 flex justify-center"><GlobalSearch /></div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative h-10 w-10 rounded-lg hover:bg-surface-muted flex items-center justify-center transition-colors" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              {alerts.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="font-semibold text-sm">Notifications</div>
              <div className="text-xs text-muted-foreground">{alerts.length} warranty alerts</div>
            </div>
            <div className="max-h-80 overflow-auto">
              {alerts.map((a) => (
                <div key={a.asset_code} className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-muted transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.asset_code} · Expires {a.warranty_expiry}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${a.days_remaining <= 7 ? "bg-red-100 text-red-700" : a.days_remaining <= 30 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {a.days_remaining}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 h-10 pl-1.5 pr-2.5 rounded-lg hover:bg-surface-muted transition-colors">
              <div className="h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-bold relative">
                {initials}
                {isAdmin && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Crown className="h-2 w-2 text-white" />
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold">{user?.full_name || "Admin"}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{user?.role || "admin"}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{user?.full_name || "Admin"}</span>
                <span className="text-xs text-muted-foreground">{user?.email || "admin@snhrc.org"}</span>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  <span className="text-foreground font-medium">Role:</span>
                  <span className="text-muted-foreground capitalize">{user?.role || "admin"}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2">
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/preferences")} className="gap-2">
              <Settings className="h-4 w-4" /> Preferences
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/users")} className="gap-2 text-amber-700 font-medium">
                  <Crown className="h-4 w-4 text-amber-600" /> Admin Panel
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onClick={logout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
