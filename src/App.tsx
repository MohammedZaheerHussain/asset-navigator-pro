import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import BranchMaster from "./pages/BranchMaster";
import DepartmentMaster from "./pages/DepartmentMaster";
import MaterialMaster from "./pages/MaterialMaster";
import CategoryMaster from "./pages/CategoryMaster";
import AddAsset from "./pages/AddAsset";
import AssetRegistry from "./pages/AssetRegistry";
import MaterialTracking from "./pages/MaterialTracking";
import MaterialTransfer from "./pages/MaterialTransfer";
import EquipmentList from "./pages/EquipmentList";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

/** Simple auth check — replace with real auth provider later */
const isAuthenticated = () => !!localStorage.getItem("snhrc_auth");

/** Guard: redirect to /login if not authenticated */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public — Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected — App Shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/masters/branches" element={<BranchMaster />} />
            <Route path="/masters/departments" element={<DepartmentMaster />} />
            <Route path="/masters/materials" element={<MaterialMaster />} />
            <Route path="/masters/categories" element={<CategoryMaster />} />
            <Route path="/assets/add" element={<AddAsset />} />
            <Route path="/assets/registry" element={<AssetRegistry />} />
            <Route path="/tracking" element={<MaterialTracking />} />
            <Route path="/transactions/transfer" element={<MaterialTransfer />} />
            <Route path="/equipment/biomedical" element={<EquipmentList type="biomedical" />} />
            <Route path="/equipment/other" element={<EquipmentList type="other" />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
