import { useState, useEffect, useCallback } from "react";
import {
  Upload, FileText, Trash2, Download, Search, Filter,
  File, Image, FileSpreadsheet, X, Plus, Eye, Receipt,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "./Documents.css";

const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000") + "/api";

interface DocumentItem {
  id: number;
  asset_code: string | null;
  document_type: string;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_size_display: string;
  notes: string | null;
  uploaded_by: number | null;
  uploader_name: string | null;
  asset_name: string | null;
  created_at: string;
}

const DOC_TYPES = [
  { value: "invoice", label: "Invoice", icon: "📄" },
  { value: "service_bill", label: "Service Bill", icon: "🧾" },
  { value: "warranty", label: "Warranty", icon: "🛡️" },
  { value: "other", label: "Other", icon: "📎" },
];

const getToken = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("snhrc_auth") || "{}");
    return auth.token || "";
  } catch { return ""; }
};

const getFileIcon = (mime: string) => {
  if (mime.startsWith("image/")) return <Image className="doc-icon img" />;
  if (mime.includes("pdf")) return <FileText className="doc-icon pdf" />;
  if (mime.includes("sheet") || mime.includes("excel")) return <FileSpreadsheet className="doc-icon xls" />;
  return <File className="doc-icon other" />;
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function Documents() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("invoice");
  const [assetCode, setAssetCode] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`${API_BASE}/documents?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) setDocs(json.data || []);
    } catch (e) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      toast.error("File and title are required");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("document_type", docType);
      if (assetCode.trim()) fd.append("asset_code", assetCode.trim());
      if (notes.trim()) fd.append("notes", notes.trim());

      const res = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Document uploaded successfully!");
        setShowUpload(false);
        resetForm();
        fetchDocs();
      } else {
        toast.error(json.message || "Upload failed");
      }
    } catch {
      toast.error("Upload failed — check connection");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const res = await fetch(`${API_BASE}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        const { file_data, mime_type, original_filename } = json.data;
        const byteChars = atob(file_data);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = original_filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Download started");
      }
    } catch {
      toast.error("Download failed");
    }
  };

  const handlePreview = async (doc: DocumentItem) => {
    if (!doc.mime_type.startsWith("image/") && !doc.mime_type.includes("pdf")) {
      handleDownload(doc);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        const { file_data, mime_type } = json.data;
        const byteChars = atob(file_data);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: mime_type });
        setPreviewUrl(URL.createObjectURL(blob));
        setPreviewName(doc.original_filename);
        setShowPreview(true);
      }
    } catch {
      toast.error("Preview failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Document deleted");
        fetchDocs();
      } else {
        toast.error(json.message || "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDocType("invoice");
    setAssetCode("");
    setNotes("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const typeLabel = (t: string) => DOC_TYPES.find(d => d.value === t)?.label || t;
  const typeIcon = (t: string) => DOC_TYPES.find(d => d.value === t)?.icon || "📎";

  return (
    <div className="documents-page">
      {/* Header */}
      <div className="docs-header">
        <div className="docs-header-left">
          <Receipt className="docs-header-icon" />
          <div>
            <h1>Documents</h1>
            <p>Invoices, service bills & warranty documents</p>
          </div>
        </div>
        <Button onClick={() => setShowUpload(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={18} /> Upload Document
        </Button>
      </div>

      {/* Filters */}
      <div className="docs-filters">
        <div className="docs-search-wrap">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by title, file name, or asset code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="docs-type-filter">
          <Filter size={16} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {DOC_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="docs-stats">
        {DOC_TYPES.map(t => {
          const count = docs.filter(d => d.document_type === t.value).length;
          return (
            <div key={t.value} className={`docs-stat-chip ${typeFilter === t.value ? "active" : ""}`}
                 onClick={() => setTypeFilter(typeFilter === t.value ? "" : t.value)}>
              <span className="docs-stat-icon">{t.icon}</span>
              <span className="docs-stat-label">{t.label}</span>
              <span className="docs-stat-count">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Document list */}
      <div className="docs-grid">
        {loading ? (
          <div className="docs-empty">Loading documents...</div>
        ) : docs.length === 0 ? (
          <div className="docs-empty">
            <FileText size={48} />
            <p>No documents found</p>
            <button onClick={() => setShowUpload(true)}>Upload your first document</button>
          </div>
        ) : (
          docs.map(doc => (
            <div key={doc.id} className="doc-card">
              <div className="doc-card-header">
                {getFileIcon(doc.mime_type)}
                <span className={`doc-type-badge ${doc.document_type}`}>
                  {typeIcon(doc.document_type)} {typeLabel(doc.document_type)}
                </span>
              </div>
              <div className="doc-card-body">
                <h3 className="doc-title">{doc.title}</h3>
                <p className="doc-filename">{doc.original_filename}</p>
                {doc.asset_code && (
                  <p className="doc-asset">
                    Asset: <strong>{doc.asset_code}</strong>
                    {doc.asset_name && <span> — {doc.asset_name}</span>}
                  </p>
                )}
                {doc.notes && <p className="doc-notes">{doc.notes}</p>}
              </div>
              <div className="doc-card-footer">
                <div className="doc-meta">
                  <span>{doc.file_size_display}</span>
                  <span>•</span>
                  <span>{formatDate(doc.created_at)}</span>
                  {doc.uploader_name && <><span>•</span><span>{doc.uploader_name}</span></>}
                </div>
                <div className="doc-actions">
                  <button onClick={() => handlePreview(doc)} title="Preview"><Eye size={16} /></button>
                  <button onClick={() => handleDownload(doc)} title="Download"><Download size={16} /></button>
                  <button onClick={() => handleDelete(doc.id)} title="Delete" className="doc-delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Dialog — standard Radix Dialog matching BranchMaster, CategoryMaster etc. */}
      <Dialog open={showUpload} onOpenChange={(v) => { if (!v) { setShowUpload(false); resetForm(); } else { setShowUpload(true); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>Upload an invoice, service bill, warranty, or other document.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Drop zone */}
            <div
              className={`docs-dropzone ${dragActive ? "active" : ""} ${file ? "has-file" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("doc-file-input")?.click()}
            >
              {file ? (
                <div className="docs-file-preview">
                  <FileText size={32} />
                  <span>{file.name}</span>
                  <span className="docs-file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }}>
                    <X size={16} /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={40} />
                  <p>Drag & drop a file here, or click to browse</p>
                  <span>PDF, Images, Word, Excel — Max 10MB</span>
                </>
              )}
              <input
                id="doc-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
                hidden
              />
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)}
                     placeholder="e.g., Ventilator Invoice - April 2026" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Document Type</Label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {DOC_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Asset Code (optional)</Label>
                <Input value={assetCode} onChange={e => setAssetCode(e.target.value)}
                       placeholder="e.g., SNHRC-001" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowUpload(false); resetForm(); }}>Cancel</Button>
              <Button type="submit" disabled={uploading || !file || !title.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {uploading ? "Uploading…" : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog — same Radix Dialog pattern */}
      <Dialog open={showPreview} onOpenChange={(v) => { if (!v) { setShowPreview(false); setPreviewUrl(null); setPreviewName(""); } }}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
            <DialogDescription>Document preview</DialogDescription>
          </DialogHeader>
          <div className="docs-preview-content">
            {previewUrl && previewName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={previewUrl} alt={previewName} />
            ) : previewUrl ? (
              <iframe src={previewUrl} title={previewName} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
