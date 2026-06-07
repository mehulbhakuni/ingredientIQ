import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ClipboardPaste, Barcode, X, Loader2, ScanLine, Image, ChevronRight } from "lucide-react";
import { useOCR } from "../hooks/useOCR";
import { useAuth } from "../context/AuthContext";
import { analyzeIngredients } from "../utils/api";
import BarcodeScanner from "../components/BarcodeScanner";

const TABS = [
  { id: "ingredients", label: "Ingredients", icon: Camera  },
  { id: "barcode",     label: "Barcode",     icon: Barcode },
  { id: "paste",       label: "Paste",       icon: ClipboardPaste },
];

export default function Scan() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const { extractText, status: ocrStatus, progress } = useOCR();

  const [tab,           setTab]           = useState("ingredients");
  const [capturedImage, setCapturedImage] = useState(null);
  const [rawText,       setRawText]       = useState("");
  const [analyzing,     setAnalyzing]     = useState(false);
  const [error,         setError]         = useState("");

  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);
  const streamRef    = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const hasProfile = user?.profile?.conditions?.length || user?.profile?.allergies?.length || user?.profile?.diets?.length;

  // ── OCR camera ───────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true); setError("");
    } catch {
      setError("Camera access denied. Upload from gallery or use the Paste tab.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
    stopCamera();
  }, [stopCamera]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCapturedImage(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  const runOCR = useCallback(async () => {
    if (!capturedImage) return;
    try { setRawText(await extractText(capturedImage)); }
    catch { setError("Could not read text from image. Try better lighting or paste manually."); }
  }, [capturedImage, extractText]);

  // ── Analysis (shared by OCR + paste) ─────────────────────
  const runAnalysis = useCallback(async (scanType = "paste") => {
    const text = rawText.trim();
    if (!text) { setError("No ingredient text to analyze."); return; }
    setError(""); setAnalyzing(true);
    try {
      const result = await analyzeIngredients({ ingredients: text, scanType });
      navigate("/result", { state: { result, ingredients: text } });
    } catch (err) {
      setError(err.message || "Analysis failed. Check your connection and try again.");
    } finally { setAnalyzing(false); }
  }, [rawText, navigate]);

  // ── Barcode product ready → analyze ──────────────────────
  const handleBarcodeProduct = useCallback(async (product) => {
    setAnalyzing(true); setError("");
    try {
      const result = await analyzeIngredients({
        ingredients:  product.ingredients,
        scanType:     "barcode",
        productName:  product.productName,
        brandName:    product.brandName,
        barcode:      product.barcode,
        imageUrl:     product.imageUrl,
      });
      navigate("/result", {
        state: {
          result:      { ...result, imageUrl: product.imageUrl, brandName: product.brandName },
          ingredients: product.ingredients,
        },
      });
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally { setAnalyzing(false); }
  }, [navigate]);

  const reset = useCallback(() => {
    setCapturedImage(null); setRawText(""); setError(""); stopCamera();
  }, [stopCamera]);

  const switchTab = useCallback((id) => {
    reset(); setTab(id);
  }, [reset]);

  const isOCRing   = ocrStatus === "loading";
  const canAnalyze = rawText.trim().length > 5 && !analyzing;

  return (
    <div className="px-5 pt-12 pb-8 min-h-screen flex flex-col">
      <div className="mb-6">
        <span className="section-label block mb-2">Scanner</span>
        <h2 className="font-display text-[28px] text-surface-50">Scan a product</h2>
      </div>

      {!hasProfile && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-[13px] font-mono text-amber-400">Profile not set up yet</p>
          <button onClick={() => navigate("/profile")} className="text-[12px] font-mono text-amber-400 underline">Set up →</button>
        </div>
      )}

      {/* 3-tab switcher */}
      <div className="flex bg-surface-800 rounded-2xl p-1 mb-5 gap-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => switchTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-body font-medium transition-all ${
              tab === id ? "bg-surface-50 text-surface-900" : "text-surface-200/50"
            }`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── INGREDIENTS TAB (OCR camera) ── */}
      {tab === "ingredients" && (
        <div className="flex flex-col gap-4 flex-1">
          {!capturedImage ? (
            <div className="relative bg-surface-800 rounded-3xl overflow-hidden aspect-[4/3]">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted
                style={{ display: cameraActive ? "block" : "none" }} />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                    <Camera size={28} className="text-brand-400" />
                  </div>
                  <p className="text-[13px] font-mono text-surface-200/40 text-center px-6">
                    Point at the ingredient list on the product label
                  </p>
                  <button onClick={startCamera} className="btn-primary w-auto px-8 text-[14px] py-3">Open Camera</button>
                </div>
              )}
              {cameraActive && (
                <>
                  <div className="absolute inset-4 border border-brand-400/40 rounded-2xl pointer-events-none">
                    <div className="scan-line" />
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />
                  </div>
                  <div className="absolute bottom-4 inset-x-4 flex gap-3">
                    <button onClick={stopCamera} className="flex-none w-12 h-12 rounded-2xl bg-surface-900/80 flex items-center justify-center">
                      <X size={20} className="text-surface-200" />
                    </button>
                    <button onClick={capturePhoto} className="flex-1 bg-brand-500 text-white rounded-2xl py-3 font-body font-medium text-[15px]">Capture</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative bg-surface-800 rounded-3xl overflow-hidden aspect-[4/3]">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              <button onClick={reset} className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-surface-900/80 flex items-center justify-center">
                <X size={16} className="text-surface-200" />
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          {!capturedImage && (
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 text-[13px] font-mono text-surface-200/40 hover:text-brand-400 transition-colors py-2">
              <Image size={14} /> Upload from gallery instead
            </button>
          )}

          {capturedImage && (
            rawText ? (
              <div className="bg-surface-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="section-label">Extracted text</span>
                  <button onClick={() => setRawText("")} className="text-[11px] font-mono text-surface-200/30 hover:text-brand-400">Edit</button>
                </div>
                <textarea className="input-field min-h-[100px] resize-none text-[13px]"
                  value={rawText} onChange={(e) => setRawText(e.target.value)} />
              </div>
            ) : (
              <button onClick={runOCR} disabled={isOCRing} className="btn-primary flex items-center justify-center gap-2">
                {isOCRing
                  ? <><Loader2 size={18} className="animate-spin" />Reading text… {progress}%</>
                  : <><ScanLine size={18} />Extract Text from Image</>}
              </button>
            )
          )}
        </div>
      )}

      {/* ── BARCODE TAB ── */}
      {tab === "barcode" && (
        <div className="flex flex-col flex-1">
          {analyzing ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 size={32} className="animate-spin text-brand-400" />
              <p className="font-body text-[15px] text-surface-50">Analyzing ingredients…</p>
            </div>
          ) : (
            <BarcodeScanner
              onProductReady={handleBarcodeProduct}
              onSwitchToOCR={() => switchTab("ingredients")}
            />
          )}
        </div>
      )}

      {/* ── PASTE TAB ── */}
      {tab === "paste" && (
        <div className="flex flex-col gap-4 flex-1">
          <div className="bg-surface-800 rounded-3xl p-4 flex-1">
            <p className="section-label mb-3">Paste ingredient list</p>
            <textarea className="input-field min-h-[220px] resize-none text-[14px]"
              placeholder="Water, Sugar, Salt, Modified Starch, Natural Flavors, Citric Acid..."
              value={rawText} onChange={(e) => setRawText(e.target.value)} autoFocus />
          </div>
          <p className="text-[12px] font-mono text-surface-200/30 text-center">
            Copy from a product website or food app
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
          <p className="text-[13px] font-mono text-red-400">{error}</p>
        </div>
      )}

      {/* Analyze button for OCR + paste tabs */}
      {canAnalyze && tab !== "barcode" && (
        <button onClick={() => runAnalysis(tab === "ingredients" ? "ocr" : "paste")}
          disabled={analyzing}
          className="btn-primary mt-5 flex items-center justify-center gap-2">
          {analyzing
            ? <><Loader2 size={18} className="animate-spin" />Analyzing for you…</>
            : <>Analyze for Me<ChevronRight size={18} /></>}
        </button>
      )}
    </div>
  );
}
