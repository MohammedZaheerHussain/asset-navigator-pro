import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Building2, Layers, PackagePlus, ListChecks, ScanLine,
  ArrowLeftRight, HeartPulse, Boxes, FileBarChart2, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: any };
type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
  ]},
  { label: "Masters", items: [
    { title: "Branch Master",     url: "/masters/branches",    icon: Building2 },
    { title: "Department Master", url: "/masters/departments", icon: Layers },
  ]},
  { label: "Asset Management", items: [
    { title: "Add Asset",      url: "/assets/add",      icon: PackagePlus },
    { title: "Asset Registry", url: "/assets/registry", icon: ListChecks },
  ]},
  { label: "Tracking", items: [
    { title: "Material Tracking", url: "/tracking", icon: ScanLine },
  ]},
  { label: "Transactions", items: [
    { title: "Material Transfer", url: "/transactions/transfer", icon: ArrowLeftRight },
  ]},
  { label: "Equipment", items: [
    { title: "Biomedical",       url: "/equipment/biomedical", icon: HeartPulse },
    { title: "Other Equipment",  url: "/equipment/other",      icon: Boxes },
  ]},
  { label: "Insights", items: [
    { title: "Reports", url: "/reports", icon: FileBarChart2 },
  ]},
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className={cn(
        "flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border",
        collapsed && "px-2 justify-center"
      )}>
        <img
          src="/snhrc-logo.jpg"
          alt="SNHRC Logo"
          className="h-9 w-9 rounded-xl object-contain shrink-0"
        />
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-sidebar-foreground">Material Management</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">SNHRC</span>
          </div>
        )}
      </div>


      <SidebarContent className="px-2 py-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all",
                            active
                              ? "bg-primary-soft text-primary font-semibold shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <div className="mt-auto border-t border-sidebar-border p-2">
        <button
          onClick={() => {
            localStorage.removeItem("snhrc_auth");
            navigate("/login");
          }}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </Sidebar>
  );
}
