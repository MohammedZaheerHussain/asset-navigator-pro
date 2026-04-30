import { useState, useRef, useEffect } from "react";
import { Search, Package, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useGetAssetsQuery, useGetBranchesQuery, type AssetRow } from "@/store/apiSlice";

export function GlobalSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Only fetch when user types 2+ chars
  const shouldSearch = q.trim().length >= 2;
  const { data: assetRes, isFetching } = useGetAssetsQuery(
    { search: q.trim(), per_page: 8 },
    { skip: !shouldSearch }
  );

  const results = assetRes?.data || [];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
      {open && shouldSearch && (
        <div className="absolute mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-elevated overflow-hidden z-50 animate-fade-in">
          {isFetching ? (
            <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No results for "{q}"</div>
          ) : (
            <div>
              <div className="px-4 pt-3 pb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Package className="h-3.5 w-3.5" />Assets
              </div>
              <div className="pb-2">
                {results.map((a: AssetRow) => (
                  <button
                    key={a.asset_code}
                    onClick={() => { navigate("/tracking"); setOpen(false); setQ(""); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-surface-muted transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.asset_code} · {a.branch_name} / {a.department_name}
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                      a.status === "active" ? "bg-success-soft text-success" : "bg-neutral-soft text-neutral"
                    )}>{a.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
