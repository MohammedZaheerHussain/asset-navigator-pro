import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings, Moon, Sun, Monitor, Bell, Table2, RotateCcw } from "lucide-react";

const PREFS_KEY = "snhrc_preferences";

const defaultPrefs = {
  theme: "system" as "light" | "dark" | "system",
  defaultRowsPerPage: "20",
  defaultAssetView: "table" as "table" | "grid",
  compactSidebar: false,
  showCostInRupees: true,
  notifyWarrantyDays: "30",
  dateFormat: "dd/MM/yyyy",
};

type Prefs = typeof defaultPrefs;

function loadPrefs(): Prefs {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return defaultPrefs;
  }
}

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    prefersDark ? root.classList.add("dark") : root.classList.remove("dark");
  }
}

export default function PreferencesPage() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs());

  useEffect(() => { applyTheme(prefs.theme); }, [prefs.theme]);

  const updatePref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    applyTheme(prefs.theme);
    toast({ title: "Preferences saved", description: "Your settings have been applied." });
  };

  const reset = () => {
    setPrefs(defaultPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(defaultPrefs));
    applyTheme(defaultPrefs.theme);
    toast({ title: "Reset", description: "Preferences restored to defaults." });
  };

  const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Customize your experience — settings are saved to this browser</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4" /> Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-3">
              {(["light", "dark", "system"] as const).map((t) => {
                const Icon = THEME_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => updatePref("theme", t)}
                    className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      prefs.theme === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium capitalize">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Compact Sidebar</Label>
              <p className="text-xs text-muted-foreground">Show icons only, expand on hover</p>
            </div>
            <Switch checked={prefs.compactSidebar} onCheckedChange={(v) => updatePref("compactSidebar", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Data Display */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Table2 className="h-4 w-4" /> Data Display</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Rows per Page</Label>
              <Select value={prefs.defaultRowsPerPage} onValueChange={(v) => updatePref("defaultRowsPerPage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Asset View</Label>
              <Select value={prefs.defaultAssetView} onValueChange={(v) => updatePref("defaultAssetView", v as "table" | "grid")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={prefs.dateFormat} onValueChange={(v) => updatePref("dateFormat", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency Display</Label>
              <div className="flex items-center h-10 gap-2 px-3 rounded-md border text-sm">
                <Switch checked={prefs.showCostInRupees} onCheckedChange={(v) => updatePref("showCostInRupees", v)} />
                <span>{prefs.showCostInRupees ? "₹ Indian Rupee" : "Plain number"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Warranty Expiry Alert (days before)</Label>
            <Select value={prefs.notifyWarrantyDays} onValueChange={(v) => updatePref("notifyWarrantyDays", v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={save} className="flex-1 sm:flex-none">
          <Settings className="h-4 w-4 mr-2" /> Save Preferences
        </Button>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-2" /> Reset Defaults
        </Button>
      </div>
    </div>
  );
}
