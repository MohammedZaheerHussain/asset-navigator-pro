import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppNavbar } from "./AppNavbar";
import { QuickAddFab } from "@/components/QuickAddFab";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppNavbar />
          <main className="flex-1 px-6 pb-10">
            <Outlet />
          </main>
        </div>
        <QuickAddFab />
      </div>
    </SidebarProvider>
  );
}
