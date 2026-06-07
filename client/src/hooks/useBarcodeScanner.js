import { useState, useRef, useCallback } from "react";

let Html5QrcodeLib;

async function getLib() {
  if (!Html5QrcodeLib) {
    const mod = await import("html5-qrcode");
    Html5QrcodeLib = mod;
  }
  return Html5QrcodeLib;
}

export function useBarcodeScanner() {
  const [status,  setStatus]  = useState("idle");  // idle | scanning | success | error
  const [error,   setError]   = useState("");
  const scannerRef            = useRef(null);
  const elementId             = "barcode-scanner-container";

  const startScanning = useCallback(async (onDetected) => {
    setStatus("scanning");
    setError("");

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await getLib();

      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
      ].filter(Boolean); // guard against undefined enum values

      const scanner = new Html5Qrcode(elementId, { verbose: false, formatsToSupport });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 260, height: 100 },   // wide rect — optimised for barcodes
          aspectRatio: 1.5,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        async (decodedText) => {
          // Stop immediately on first hit
          try { await scanner.stop(); } catch { /* already stopped */ }
          scannerRef.current = null;
          setStatus("success");
          onDetected(decodedText);
        },
        () => { /* per-frame failure — normal while searching, ignore */ }
      );
    } catch (err) {
      console.error("Scanner start error:", err);
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("permission") || msg.includes("notallowed")) {
        setError("Camera permission denied. Allow camera access and try again.");
      } else if (msg.includes("notfound") || msg.includes("no camera") || msg.includes("overconstrained")) {
        setError("No camera found. Try uploading an image instead.");
      } else {
        setError("Could not start the camera. Try refreshing the page.");
      }
      setStatus("error");
    }
  }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setStatus("idle");
    setError("");
  }, []);

  const reset = useCallback(() => {
    stopScanning();
  }, [stopScanning]);

  return { status, error, elementId, startScanning, stopScanning, reset };
}
