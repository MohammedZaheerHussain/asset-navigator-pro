/**
 * QRCodeDisplay — Generates and displays a QR code for an asset
 *
 * Encodes the asset_code into a QR code image.
 * Supports: display, download as PNG, and print.
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QRCodeDisplayProps {
  /** The value to encode (typically asset_code like "AST-MED-001") */
  value: string;
  /** Label shown below QR (e.g., asset name) */
  label?: string;
  /** Size in pixels. Default: 200 */
  size?: number;
  /** Whether to show action buttons. Default: true */
  showActions?: boolean;
  /** Additional class names */
  className?: string;
}

export function QRCodeDisplay({
  value,
  label,
  size = 200,
  showActions = true,
  className,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#1a1a2e",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    }).catch(() => setError(true));
  }, [value, size]);

  const handleDownload = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(value, {
        width: 600,
        margin: 4,
        color: { dark: "#1a1a2e", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });

      // Convert data URL to blob for reliable download
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `QR-${value}.png`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (err) {
      console.error("QR download failed:", err);
    }
  };

  const handlePrint = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(value, {
        width: 400,
        margin: 3,
        color: { dark: "#1a1a2e", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code — ${value}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: Arial, sans-serif; }
              .qr-label { margin-top: 16px; font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #1a1a2e; }
              .qr-sub { margin-top: 4px; font-size: 12px; color: #666; }
              @media print { body { padding: 20mm; } }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" width="300" height="300" />
            <div class="qr-label">${value}</div>
            ${label ? `<div class="qr-sub">${label}</div>` : ""}
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch {
      // ignore
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Failed to generate QR code
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* QR Code Canvas */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-border">
        <canvas ref={canvasRef} />
      </div>

      {/* Asset Code Label */}
      {label && (
        <p className="text-xs text-muted-foreground font-medium text-center max-w-[200px] truncate">
          {label}
        </p>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-xs gap-1.5"
          >
            {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy Code"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 text-xs gap-1.5"
          >
            <Printer className="h-3 w-3" />
            Print
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * QRCodeMini — Smaller inline QR code for tables/lists
 */
export function QRCodeMini({
  value,
  size = 48,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: "#1a1a2e", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch(() => {});
  }, [value, size]);

  return (
    <div className={cn("bg-white rounded-md p-1 border border-border inline-flex", className)}>
      <canvas ref={canvasRef} />
    </div>
  );
}
