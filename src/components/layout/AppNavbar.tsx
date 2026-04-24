import { SidebarTrigger } from "@/components/ui/sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Bell, ChevronDown, ShieldCheck } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { assets } from "@/lib/mock-data";
import { WarrantyBadge } from "@/components/StatusBadges";

export function AppNavbar() {
  const alerts = assets.filter((a) => a.warrantyStatus !== "valid" && a.alertEnabled).slice(0, 5);

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/90 backdrop-blur border-b border-border flex items-center gap-3 px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <div className="flex-1 flex justify-center">
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative h-10 w-10 rounded-lg hover:bg-surface-muted flex items-center justify-center transition-colors" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              {alerts.length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="font-semibold text-sm">Notifications</div>
              <div className="text-xs text-muted-foreground">{alerts.length} active alerts</div>
            </div>
            <div className="max-h-80 overflow-auto">
              {alerts.map((a) => (
                <div key={a.id} className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-surface-muted transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.id} · Warranty {a.warrantyExpiry}</div>
                    </div>
                    <WarrantyBadge status={a.warrantyStatus} />
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 h-10 pl-1.5 pr-2.5 rounded-lg hover:bg-surface-muted transition-colors">
              <div className="h-7 w-7 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                DM
              </div>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold">Dr. Mehta</span>
                <span className="text-[10px] text-muted-foreground">Admin</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">Dr. R. Mehta</span>
                <span className="text-xs text-muted-foreground">r.mehta@snhrc.org</span>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  <span className="text-foreground font-medium">Role:</span>
                  <span className="text-muted-foreground">Administrator</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Last login: Today, 08:42 AM</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
