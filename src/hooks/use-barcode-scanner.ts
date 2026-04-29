/**
 * useBarcodeScanner — Detects barcode scanner input
 * 
 * Barcode scanners act as keyboard HID devices, typing characters
 * very rapidly (~10-30ms between keys) and finishing with Enter.
 * This hook differentiates scanner input from manual typing.
 */

import { useCallback, useRef } from "react";

interface BarcodeScannerOptions {
  /** Max time (ms) between keystrokes to be considered scanner input. Default: 50 */
  maxKeystrokeDelay?: number;
  /** Minimum length of scanned input. Default: 5 */
  minLength?: number;
  /** Callback when a barcode is fully scanned */
  onScan: (barcode: string) => void;
  /** Whether the scanner is enabled. Default: true */
  enabled?: boolean;
}

export function useBarcodeScanner({
  maxKeystrokeDelay = 50,
  minLength = 5,
  onScan,
  enabled = true,
}: BarcodeScannerOptions) {
  const bufferRef = useRef("");
  const lastKeystrokeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!enabled) return;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeystrokeRef.current;

      // If too much time has passed, reset the buffer
      if (timeSinceLastKey > maxKeystrokeDelay && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Enter key → if we have a valid buffer, it's a scan
      if (e.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          const scannedValue = bufferRef.current;
          bufferRef.current = "";
          onScan(scannedValue);
          return;
        }
        bufferRef.current = "";
        return;
      }

      // Only accept printable characters
      if (e.key.length === 1) {
        if (timeSinceLastKey <= maxKeystrokeDelay || bufferRef.current.length === 0) {
          bufferRef.current += e.key;
        } else {
          bufferRef.current = e.key;
        }
        lastKeystrokeRef.current = now;

        // Auto-clear buffer after timeout (in case Enter is never pressed)
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          bufferRef.current = "";
        }, maxKeystrokeDelay * 3);
      }
    },
    [enabled, maxKeystrokeDelay, minLength, onScan]
  );

  const resetBuffer = useCallback(() => {
    bufferRef.current = "";
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return {
    /** Attach to onKeyDown of the input element */
    handleScannerKeyDown: handleKeyDown,
    /** Reset scanner buffer manually */
    resetBuffer,
  };
}
