import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Building2, Layers, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { assets, branches, departments, branchById, deptById } from "@/lib/mock-data";
import { StatusBadge } from "./StatusBadges";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { assets: [], branches: [], departments: [] };
    return {
      assets: assets.filter((a) =>
        a.name.toLowerCase().includes(term) ||
        a.id.toLowerCase().includes(term) ||
        a.serial.toLowerCase().includes(term)
      ).slice(0, 5),
      branches: branches.filter((b) =>
        b.name.toLowerCase().includes(term) || b.code.toLowerCase().includes(term)
      ).slice(0, 3),
      departments: departments.filter((d) =>
        d.name.toLowerCase().includes(term) || d.code.toLowerCase().includes(term)
      ).slice(0, 3),
    };
  }, [q]);

  const hasResults = results.assets.length + results.branches.length + results.departments.length > 0;

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search assets, branches, departments…"
          className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-muted border border-transparent focus:bg-surface focus:border-border focus:ring-2 focus:ring-ring/30 outline-none text-sm transition-colors"
        />
      </div>
      {open && q && (
        <div className="absolute mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-elevated overflow-hidden z-50 animate-fade-in">
          {!hasResults && (
            <div className="p-6 text-center text-sm text-muted-foreground">No results for "{q}"</div>
          )}
          {results.assets.length > 0 && (
            <Group icon={Package} label="Assets">
              {results.assets.map((a) => (
                <Item key={a.id} onClick={() => { navigate("/assets/registry"); setOpen(false); setQ(""); }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {a.id} · {branchById(a.branchId)?.alias} / {deptById(a.departmentId)?.alias} · {a.room}
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </Item>
              ))}
            </Group>
          )}
          {results.branches.length > 0 && (
            <Group icon={Building2} label="Branches">
              {results.branches.map((b) => (
                <Item key={b.id} onClick={() => { navigate("/masters/branches"); setOpen(false); setQ(""); }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.code}</div>
                  </div>
                </Item>
              ))}
            </Group>
          )}
          {results.departments.length > 0 && (
            <Group icon={Layers} label="Departments">
              {results.departments.map((d) => (
                <Item key={d.id} onClick={() => { navigate("/masters/departments"); setOpen(false); setQ(""); }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.code} · {branchById(d.branchId)?.alias}</div>
                  </div>
                </Item>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="px-4 pt-3 pb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="pb-2">{children}</div>
    </div>
  );
}

function Item({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-muted transition-colors text-left", className)}
    >
      {children}
    </button>
  );
}
