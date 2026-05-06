/**
 * CameraScanner — Mobile camera QR code scanning using html5-qrcode
 *
 * Opens camera viewfinder in a modal overlay, auto-triggers on scan.
 * Supports QR codes (primary) and barcodes (fallback).
 * Falls back gracefully if camera permission is denied.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraScannerProps {
  onScan: (value: string) => void;
  className?: string;
}

export function CameraScanner({ onScan, className }: CameraScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;

    setIsStarting(true);
    setError(null);

    try {
      const scanner = new Html5Qrcode("camera-scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          // Success — stop scanner and return value
          onScan(decodedText);
          stopScanner();
          setIsOpen(false);
        },
        () => {
          // QR code scan error — ignore (expected while scanning)
        }
      );
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setError("Camera permission denied. Please allow camera access and try again.");
      } else if (msg.includes("NotFound") || msg.includes("no camera")) {
        setError("No camera found on this device.");
      } else {
        setError("Unable to start camera. Please use manual input instead.");
      }
    } finally {
      setIsStarting(false);
    }
  }, [onScan, stopScanner]);

  // Start scanner when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isOpen, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  return (
    <>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => { setIsOpen(true); setError(null); }}
        className={cn(
          "h-12 px-4 gap-2 border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all",
          className
        )}
      >
        <Camera className="h-4.5 w-4.5" />
        <span className="hidden sm:inline">Scan</span>
      </Button>

      {/* Camera Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white">
                <Camera className="h-5 w-5" />
                <span className="font-semibold text-lg">Scan QR Code</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Scanner Container */}
            <div className="rounded-2xl overflow-hidden bg-black shadow-2xl">
              <div
                id="camera-scanner-container"
                ref={containerRef}
                className="w-full min-h-[280px]"
              />

              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <div className="flex flex-col items-center gap-3 text-white">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm font-medium">Starting camera…</p>
                  </div>
                </div>
              )}
            </div>

            {/* Error State */}
            {error && (
              <div className="mt-4 flex items-start gap-3 bg-red-500/20 text-red-200 rounded-xl p-4">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{error}</p>
                  <p className="text-xs mt-1 opacity-70">Use manual input as an alternative.</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-white/60 text-xs">
                Point your camera at a QR code. It will scan automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
