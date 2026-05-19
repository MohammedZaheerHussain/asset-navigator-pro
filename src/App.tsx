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
import Documents from "./pages/Documents";
import ServiceLog from "./pages/ServiceLog";
import DepreciationPage from "./pages/DepreciationPage";
import EvaluationPage from "./pages/EvaluationPage";
import CondemnationPage from "./pages/CondemnationPage";
import DisposalPage from "./pages/DisposalPage";
import ProfilePage from "./pages/ProfilePage";
import PreferencesPage from "./pages/PreferencesPage";
import UserManagement from "./pages/UserManagement";
import AuditLog from "./pages/admin/AuditLog";
import SystemInfo from "./pages/admin/SystemInfo";
import SupplierMaster from "./pages/procurement/SupplierMaster";
import PurchaseEntry from "./pages/procurement/PurchaseEntry";
import PurchaseRegistry from "./pages/procurement/PurchaseRegistry";
import InvoiceManagement from "./pages/procurement/InvoiceManagement";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

import { isAuthenticated, getUser } from "@/store/apiSlice";

/** Guard: redirect to /login if not authenticated */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/** Guard: redirect to / if not an admin */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
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
            {/* Core Pages */}
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
            <Route path="/documents" element={<Documents />} />

            {/* Service & Depreciation */}
            <Route path="/service/log" element={<ServiceLog />} />
            <Route path="/service/depreciation" element={<DepreciationPage />} />
            <Route path="/service/evaluation" element={<EvaluationPage />} />
            <Route path="/service/condemnation" element={<CondemnationPage />} />
            <Route path="/service/disposal" element={<DisposalPage />} />

            {/* Procurement */}
            <Route path="/procurement/suppliers" element={<SupplierMaster />} />
            <Route path="/procurement/purchase/new" element={<PurchaseEntry />} />
            <Route path="/procurement/purchases" element={<PurchaseRegistry />} />
            <Route path="/procurement/invoices" element={<InvoiceManagement />} />

            {/* Account — all authenticated users */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/preferences" element={<PreferencesPage />} />

            {/* Admin-only routes */}
            <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/admin/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />
            <Route path="/admin/system" element={<AdminRoute><SystemInfo /></AdminRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
