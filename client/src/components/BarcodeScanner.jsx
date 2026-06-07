import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Barcode, Loader2, X, ScanLine, RefreshCw, PackageSearch, PlusCircle } from "lucide-react";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { lookupBarcode } from "../utils/api";

// States: idle → scanning → fetching → found | notFound | fetchError
export default function BarcodeScanner({ onProductReady, onSwitchToOCR }) {
  const navigate = useNavigate();
  const { status: scanStatus, error: scanError, elementId, startScanning, stopScanning, reset: resetScanner } = useBarcodeScanner();

  const [phase,    setPhase]    = useState("idle");
  const [barcode,  setBarcode]  = useState("");
  const [product,  setProduct]  = useState(null);
  const [fetchErr, setFetchErr] = useState("");

  const handleDetected = useCallback(async (code) => {
    setBarcode(code);
    setPhase("fetching");
    try {
      const data = await lookupBarcode(code);
      setProduct(data);
      setPhase("found");
    } catch (err) {
      if (err.notFound) setPhase("notFound");
      else { setFetchErr(err.message); setPhase("fetchError"); }
    }
  }, []);

  const startScan = useCallback(() => {
    setPhase("scanning");
    startScanning(handleDetected);
  }, [startScanning, handleDetected]);

  const resetAll = useCallback(() => {
    resetScanner();
    setPhase("idle"); setBarcode(""); setProduct(null); setFetchErr("");
  }, [resetScanner]);

  useEffect(() => () => stopScanning(), [stopScanning]);

  // ── IDLE ─────────────────────────────────────────────────
  if (phase === "idle") return (
    <div className="flex flex-col items-center justify-center gap-5 py-10">
      <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center">
        <Barcode size={36} className="text-brand-400" />
      </div>
      <div className="text-center px-4">
        <p className="font-body text-[15px] text-surface-50 mb-1">Scan a product barcode</p>
        <p className="text-[12px] font-mono text-surface-200/40">Supports EAN-13, UPC-A/E, Code-128</p>
      </div>
      <button onClick={startScan} className="btn-primary w-auto px-10">Open Camera</button>
    </div>
  );

  // ── SCANNING ─────────────────────────────────────────────
  if (phase === "scanning") return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-3xl overflow-hidden bg-surface-800">
        <div id={elementId} className="w-full" style={{ minHeight: "260px" }} />
        <div className="absolute inset-4 pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-400 rounded-br-xl" />
        </div>
        <button onClick={resetAll}
          className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-surface-900/80 flex items-center justify-center z-10">
          <X size={16} className="text-surface-200" />
        </button>
      </div>
      {scanError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
          <p className="text-[13px] font-mono text-red-400">{scanError}</p>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          <p className="text-[12px] font-mono text-surface-200/40">Point at a barcode — scanning automatically</p>
        </div>
      )}
    </div>
  );

  // ── FETCHING ─────────────────────────────────────────────
  if (phase === "fetching") return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Loader2 size={32} className="animate-spin text-brand-400" />
      <div className="text-center">
        <p className="font-body text-[15px] text-surface-50">Looking up product…</p>
        <p className="text-[12px] font-mono text-surface-200/30 mt-1">{barcode}</p>
      </div>
    </div>
  );

  // ── NOT FOUND — with contribute option ───────────────────
  if (phase === "notFound") return (
    <div className="flex flex-col items-center justify-center gap-5 py-8">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <PackageSearch size={28} className="text-amber-400" />
      </div>
      <div className="text-center px-4">
        <p className="font-body text-[16px] text-surface-50 mb-1">Product not found</p>
        <p className="text-[12px] font-mono text-surface-200/40 mb-1">
          Barcode <span className="text-surface-200/60 font-mono">{barcode}</span>
        </p>
        <p className="text-[12px] font-mono text-surface-200/30">
          Not in Open Food Facts or our database.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full px-2">
        {/* Primary CTA — contribute */}
        <button
          onClick={() => navigate("/contribute", { state: { barcode } })}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          Add This Product
        </button>

        <button onClick={onSwitchToOCR} className="btn-secondary flex items-center justify-center gap-2 text-[14px]">
          <ScanLine size={14} /> Scan Ingredients Instead
        </button>
        <button onClick={resetAll}
          className="flex items-center justify-center gap-2 text-[13px] font-mono text-surface-200/30 hover:text-brand-400 transition-colors py-2">
          <RefreshCw size={12} /> Try Another Barcode
        </button>
      </div>
    </div>
  );

  // ── FETCH ERROR ───────────────────────────────────────────
  if (phase === "fetchError") return (
    <div className="flex flex-col items-center justify-center gap-5 py-8">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 w-full">
        <p className="text-[13px] font-mono text-red-400">{fetchErr}</p>
      </div>
      <div className="flex flex-col gap-3 w-full">
        <button onClick={resetAll} className="btn-primary flex items-center justify-center gap-2">
          <RefreshCw size={16} /> Try Again
        </button>
        <button onClick={onSwitchToOCR} className="btn-secondary text-[14px] flex items-center justify-center gap-2">
          <ScanLine size={14} /> Scan Ingredients Instead
        </button>
      </div>
    </div>
  );

  // ── FOUND ─────────────────────────────────────────────────
  if (phase === "found" && product) return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface-800 border border-brand-500/20 rounded-3xl overflow-hidden">
        {product.imageUrl && (
          <div className="w-full h-40 bg-surface-700 flex items-center justify-center overflow-hidden">
            <img src={product.imageUrl} alt={product.productName}
              className="h-full w-full object-contain p-3"
              onError={(e) => { e.target.parentElement.style.display = "none"; }} />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <p className="font-display text-[18px] text-surface-50 leading-tight">{product.productName}</p>
              {product.brandName && (
                <p className="text-[13px] font-mono text-brand-400/70 mt-0.5">{product.brandName}</p>
              )}
            </div>
            <span className="tag bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[11px] flex-shrink-0">
              Found ✓
            </span>
          </div>
          <p className="text-[12px] font-mono text-surface-200/30 mt-2">Barcode: {barcode}</p>
        </div>
        <div className="border-t border-surface-700 px-4 pb-4 pt-3">
          <p className="section-label mb-2">Ingredients</p>
          <p className="text-[12px] font-mono text-surface-200/50 leading-relaxed line-clamp-4">
            {product.ingredients}
          </p>
        </div>
      </div>
      <button onClick={() => onProductReady(product)} className="btn-primary flex items-center justify-center gap-2">
        Analyze for Me →
      </button>
      <button onClick={resetAll} className="btn-secondary text-[13px] flex items-center justify-center gap-2">
        <RefreshCw size={13} /> Scan Different Barcode
      </button>
    </div>
  );

  return null;
}
