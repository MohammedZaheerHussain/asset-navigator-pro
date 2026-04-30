import { useRef, useEffect } from "react";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface BarcodeDisplayProps {
  value: string;
  width?: number;
  height?: number;
  showActions?: boolean;
  compact?: boolean;
}

export function BarcodeDisplay({
  value,
  width = 2,
  height = 60,
  showActions = true,
  compact = false,
}: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      JsBarcode(canvasRef.current, value, {
        format: "CODE128",
        width,
        height: compact ? 40 : height,
        displayValue: true,
        fontSize: compact ? 12 : 16,
        font: "Inter, sans-serif",
        fontOptions: "bold",
        textMargin: 4,
        margin: compact ? 6 : 10,
        background: "#ffffff",
        lineColor: "#1a1f2e",
      });
    }
  }, [value, width, height, compact]);

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `barcode-${value}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  function handlePrint() {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode — ${value}</title>
          <style>
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: Inter, sans-serif; }
            img { max-width: 90%; }
            .label { font-size: 12px; color: #666; margin-top: 8px; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Barcode ${value}" />
          <div class="label">SNHRC Material Management — ${value}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="bg-white rounded-lg p-2 shadow-sm border border-border">
        <canvas ref={canvasRef} />
      </div>
      {showActions && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      )}
    </div>
  );
}
