import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  "": "Dashboard",
  dashboard: "Dashboard",
  masters: "Masters",
  branches: "Branch Master",
  departments: "Department Master",
  assets: "Asset Management",
  add: "Add Asset",
  registry: "Asset Registry",
  tracking: "Material Tracking",
  transactions: "Transactions",
  transfer: "Material Transfer",
  equipment: "Equipment",
  biomedical: "Biomedical",
  other: "Other Equipment",
  reports: "Reports",
};

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <div className={cn("sticky top-16 z-20 -mx-6 px-6 py-4 bg-background/85 backdrop-blur border-b border-border", className)}>
      <nav className="flex items-center text-xs text-muted-foreground gap-1 mb-2" aria-label="Breadcrumb">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        {parts.map((seg, i) => {
          const href = "/" + parts.slice(0, i + 1).join("/");
          const isLast = i === parts.length - 1;
          const label = labels[seg] ?? seg;
          return (
            <span key={href} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              {isLast ? (
                <span className="text-foreground font-medium">{label}</span>
              ) : (
                <Link to={href} className="hover:text-foreground transition-colors">{label}</Link>
              )}
            </span>
          );
        })}
      </nav>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
