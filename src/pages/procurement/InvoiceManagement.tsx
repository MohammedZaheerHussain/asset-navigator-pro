import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGetAllInvoicesQuery, useDeleteInvoiceMutation, type PurchaseInvoiceRow } from "@/store/apiSlice";
import {
  FileText, Search, RefreshCw, Loader2, Download, Trash2, File, FileImage, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const FILE_ICONS: Record<string, typeof File> = {
  "application/pdf": FileText,
  "image/jpeg": FileImage,
  "image/png": FileImage,
};

export default function InvoiceManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: invoicesRes, isLoading, refetch } = useGetAllInvoicesQuery(search ? { search } : undefined);
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const invoices: PurchaseInvoiceRow[] = invoicesRes?.data || [];

  const fmt = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleDelete = async (id: number) => {
    try {
      await deleteInvoice(id).unwrap();
      toast({ title: "Deleted", description: "Invoice record removed" });
      refetch();
    } catch (e: any) {
      toast({ title: "Error", description: e.data?.message || "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" /> Invoice Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage all procurement invoices</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Invoices</p><p className="text-2xl font-bold">{invoices.length}</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Value</p><p className="text-2xl font-bold">{fmt(invoices.reduce((s, i) => s + (i.grand_total || 0), 0))}</p></CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4"><p className="text-xs text-muted-foreground">Suppliers</p><p className="text-2xl font-bold">{new Set(invoices.map((i) => i.supplier_name)).size}</p></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by invoice, supplier, or purchase code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Invoice Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
      ) : invoices.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-lg font-medium">No invoices found</p>
          <p className="text-sm mt-1">Invoices will appear here when attached to purchase entries</p>
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((inv) => {
            const IconComp = FILE_ICONS[inv.file_type || ""] || File;
            return (
              <Card key={inv.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4 space-y-3">
                  {/* File icon + name */}
                  <div className="flex items-start gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      inv.file_type?.includes("pdf") ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    )}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{inv.file_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {inv.file_size ? `${(inv.file_size / 1024).toFixed(1)} KB` : "—"} · {inv.file_type || "unknown"}
                      </div>
                    </div>
                  </div>

                  {/* Linked purchase */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase</span>
                      <span className="font-mono font-semibold text-teal-700">{inv.purchase_code || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice #</span>
                      <span className="font-mono">{inv.invoice_number || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Supplier</span>
                      <span className="font-medium truncate ml-2">{inv.supplier_name || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-bold text-teal-700">{fmt(inv.grand_total || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uploaded</span>
                      <span>{new Date(inv.uploaded_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                    </div>
                    {inv.uploaded_by_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">By</span>
                        <span>{inv.uploaded_by_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => window.open(inv.file_path, "_blank")}>
                      <Download className="h-3 w-3 mr-1" /> Download
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => handleDelete(inv.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
