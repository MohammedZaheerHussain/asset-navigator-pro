import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Building2, Layers, PackagePlus, ListChecks, ScanLine,
  ArrowLeftRight, HeartPulse, Boxes, FileBarChart2, LogOut, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Section Color Themes ─────────────────────────────────────────
type SectionTheme = {
  accent: string;        // icon + active bg hue
  activeBg: string;      // active item background
  activeText: string;    // active item text
  activeIcon: string;    // active icon color
  activeBorder: string;  // left border indicator
  hoverBg: string;       // hover background
  labelColor: string;    // section label color
};

const sectionThemes: Record<string, SectionTheme> = {
  Overview: {
    accent: "blue",
    activeBg: "bg-blue-500/12",
    activeText: "text-blue-700 dark:text-blue-300",
    activeIcon: "text-blue-600 dark:text-blue-400",
    activeBorder: "border-l-blue-500",
    hoverBg: "hover:bg-blue-500/8",
    labelColor: "text-blue-500/70",
  },
  Masters: {
    accent: "purple",
    activeBg: "bg-purple-500/12",
    activeText: "text-purple-700 dark:text-purple-300",
    activeIcon: "text-purple-600 dark:text-purple-400",
    activeBorder: "border-l-purple-500",
    hoverBg: "hover:bg-purple-500/8",
    labelColor: "text-purple-500/70",
  },
  "Asset Management": {
    accent: "teal",
    activeBg: "bg-teal-500/12",
    activeText: "text-teal-700 dark:text-teal-300",
    activeIcon: "text-teal-600 dark:text-teal-400",
    activeBorder: "border-l-teal-500",
    hoverBg: "hover:bg-teal-500/8",
    labelColor: "text-teal-500/70",
  },
  Tracking: {
    accent: "orange",
    activeBg: "bg-orange-500/12",
    activeText: "text-orange-700 dark:text-orange-300",
    activeIcon: "text-orange-600 dark:text-orange-400",
    activeBorder: "border-l-orange-500",
    hoverBg: "hover:bg-orange-500/8",
    labelColor: "text-orange-500/70",
  },
  Transactions: {
    accent: "indigo",
    activeBg: "bg-indigo-500/12",
    activeText: "text-indigo-700 dark:text-indigo-300",
    activeIcon: "text-indigo-600 dark:text-indigo-400",
    activeBorder: "border-l-indigo-500",
    hoverBg: "hover:bg-indigo-500/8",
    labelColor: "text-indigo-500/70",
  },
  Equipment: {
    accent: "emerald",
    activeBg: "bg-emerald-500/12",
    activeText: "text-emerald-700 dark:text-emerald-300",
    activeIcon: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-l-emerald-500",
    hoverBg: "hover:bg-emerald-500/8",
    labelColor: "text-emerald-500/70",
  },
  Insights: {
    accent: "amber",
    activeBg: "bg-amber-500/12",
    activeText: "text-amber-700 dark:text-amber-300",
    activeIcon: "text-amber-600 dark:text-amber-400",
    activeBorder: "border-l-amber-500",
    hoverBg: "hover:bg-amber-500/8",
    labelColor: "text-amber-500/70",
  },
};

// ─── Navigation Config ────────────────────────────────────────────
type NavItem = { title: string; url: string; icon: any };
type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  { label: "Overview", items: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
  ]},
  { label: "Masters", items: [
    { title: "Branch Master",     url: "/masters/branches",    icon: Building2 },
    { title: "Department Master", url: "/masters/departments", icon: Layers },
    { title: "Material Master",   url: "/masters/materials",   icon: Package },
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

// ─── Main Sidebar Component ──────────────────────────────────────
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r-0 sidebar-glass">
      {/* ── Logo Header ────────────────────────────────────── */}
      <div className={cn(
        "flex items-center gap-3 h-16 border-b border-white/10 dark:border-white/5",
        collapsed ? "px-2 justify-center" : "px-5"
      )}>
        <div className="relative">
          <img
            src="/snhrc-logo.jpg"
            alt="SNHRC Logo"
            className="h-10 w-10 rounded-xl object-contain shrink-0 ring-2 ring-white/20 shadow-lg"
          />
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[13px] text-sidebar-foreground tracking-tight">
              Material Management
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/50 font-medium">
              SNHRC Hospital
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <SidebarContent className="px-2.5 py-3 sidebar-scroll">
        {sections.map((section) => {
          const theme = sectionThemes[section.label] || sectionThemes.Overview;
          return (
            <SidebarGroup key={section.label} className="mb-1">
              {!collapsed && (
                <SidebarGroupLabel className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.18em] px-3 mb-1",
                  theme.labelColor
                )}>
                  {section.label}
                </SidebarGroupLabel>
              )}
              {collapsed && <div className="h-px bg-sidebar-foreground/10 mx-2 my-1.5" />}
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
                              "sidebar-nav-item group",
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium",
                              "transition-all duration-200 ease-out",
                              "border-l-[3px] border-l-transparent",
                              active
                                ? cn(
                                    theme.activeBg,
                                    theme.activeText,
                                    theme.activeBorder,
                                    "font-semibold shadow-sm",
                                  )
                                : cn(
                                    "text-sidebar-foreground/75",
                                    theme.hoverBg,
                                    "hover:text-sidebar-foreground",
                                    "hover:translate-x-0.5",
                                  )
                            )}
                          >
                            <item.icon className={cn(
                              "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                              active
                                ? theme.activeIcon
                                : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                            )} />
                            {!collapsed && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* ── Logout Footer ──────────────────────────────────── */}
      <div className="mt-auto border-t border-white/10 dark:border-white/5 p-2.5">
        <button
          onClick={() => {
            localStorage.removeItem("snhrc_auth");
            localStorage.removeItem("snhrc_token");
            navigate("/login");
          }}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5",
            "text-[13px] font-medium text-sidebar-foreground/60",
            "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400",
            "transition-all duration-200 ease-out",
            "border-l-[3px] border-l-transparent hover:border-l-red-500",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </Sidebar>
  );
}
