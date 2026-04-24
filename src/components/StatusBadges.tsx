import { cn } from "@/lib/utils";
import type { AssetStatus, WarrantyStatus } from "@/lib/mock-data";
import { Activity, Wrench, ArrowRightLeft, Archive, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

const assetStatusConfig: Record<AssetStatus, { label: string; cls: string; Icon: typeof Activity }> = {
  active:      { label: "Active",         cls: "bg-success-soft text-success border-success/20",  Icon: Activity },
  maintenance: { label: "In Maintenance", cls: "bg-warning-soft text-warning border-warning/30",  Icon: Wrench },
  transfer:    { label: "In Transfer",    cls: "bg-info-soft text-info border-info/20",           Icon: ArrowRightLeft },
  retired:     { label: "Retired",        cls: "bg-neutral-soft text-neutral border-neutral/20",  Icon: Archive },
};

const warrantyConfig: Record<WarrantyStatus, { label: string; cls: string; Icon: typeof Activity }> = {
  valid:    { label: "Valid",          cls: "bg-success-soft text-success border-success/20", Icon: ShieldCheck },
  expiring: { label: "Expiring Soon",  cls: "bg-warning-soft text-warning border-warning/30", Icon: ShieldAlert },
  expired:  { label: "Expired",        cls: "bg-danger-soft text-danger border-danger/20",    Icon: ShieldX },
};

interface BadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "sm" }: BadgeProps & { status: AssetStatus }) {
  const c = assetStatusConfig[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
      c.cls,
      className,
    )}>
      <c.Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {c.label}
    </span>
  );
}

export function WarrantyBadge({ status, className, size = "sm" }: BadgeProps & { status: WarrantyStatus }) {
  const c = warrantyConfig[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
      c.cls,
      className,
    )}>
      <c.Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {c.label}
    </span>
  );
}
