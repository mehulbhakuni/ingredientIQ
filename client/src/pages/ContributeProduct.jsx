import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Upload, ScanLine, Loader2, CheckCircle, Package, AlertTriangle, X } from "lucide-react";
import { useOCR } from "../hooks/useOCR";
import { submitProduct, analyzeIngredients } from "../utils/api";
import { useAuth } from "../context/AuthContext";

function ImageUploadField({ label, hint, value, onChange, id }) {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <p className="section-label mb-2">{label}</p>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} id={id} />
      {value ? (
        <div className="relative rounded-2xl overflow-hidden glass-card" style={{border:"0.5px solid rgba(34,197,94,0.2)"}}>
          <img src={value} alt={label} className="w-full h-36 object-cover" />
          <button onClick={() => onChange("")}
            className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{background:"rgba(6,13,26,0.8)"}}>
            <X size={14} className="text-white/70" />
          </button>
          <div className="absolute bottom-2 left-2">
            <span className="tag text-brand-400 text-[11px]" style={{background:"rgba(34,197,94,0.1)",border:"0.5px solid rgba(34,197,94,0.2)"}}>
              <CheckCircle size={10} /> Uploaded
            </span>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="w-full h-28 rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors"
          style={{border:"1px dashed rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.02)"}}>
          <Upload size={20} style={{color:"rgba(255,255,255,0.2)"}} />
          <span className="text-[12px] font-mono" style={{color:"rgba(255,255,255,0.25)"}}>{hint}</span>
        </button>
      )}
    </div>
  );
}

export default function ContributeProduct() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();
  const { extractText, status: ocrStatus, progress } = useOCR();
  const prefillBarcode = location.state?.barcode || "";

  const [form, setForm] = useState({ barcode: prefillBarcode, productName: "", brandName: "", ingredients: "" });
  const [frontImage,      setFrontImage]      = useState("");
  const [ingredientImage, setIngredientImage] = useState("");
  const [ocrDone,         setOcrDone]         = useState(false);
  const [submitting,      setSubmitting]       = useState(false);
  const [analyzing,       setAnalyzing]        = useState(false);
  const [error,           setError]            = useState("");
  const [submitted,       setSubmitted]        = useState(false);

  const handleField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const runOCR = useCallback(async () => {
    if (!ingredientImage) return; setError("");
    try { const text = await extractText(ingredientImage); setForm((f) => ({ ...f, ingredients: text })); setOcrDone(true); }
    catch { setError("Could not read text from the image. You can type the ingredients manually."); }
  }, [ingredientImage, extractText]);

  const handleSubmit = async () => {
    if (!form.barcode.trim())     { setError("Barcode is required."); return; }
    if (!form.productName.trim()) { setError("Product name is required."); return; }
    if (!form.ingredients.trim()) { setError("Ingredients text is required."); return; }
    setError(""); setSubmitting(true);
    try {
      const { product } = await submitProduct({
        barcode: form.barcode.trim(), productName: form.productName.trim(),
        brandName: form.brandName.trim(), ingredients: form.ingredients.trim(),
        frontImageData: frontImage||undefined, ingredientImageData: ingredientImage||undefined,
      });
      setSubmitted(true); setSubmitting(false);
      const hasProfile = user?.profile?.conditions?.length || user?.profile?.allergies?.length || user?.profile?.diets?.length;
      if (!hasProfile) { navigate("/scan"); return; }
      setAnalyzing(true);
      try {
        const result = await analyzeIngredients({
          ingredients: product.ingredients, scanType: "barcode",
          productName: product.productName, brandName: product.brandName,
          barcode: product.barcode, imageUrl: "",
        });
        navigate("/result", { state: { result: { ...result, brandName: product.brandName, imageUrl: product.imageUrl }, ingredients: product.ingredients } });
      } catch { navigate("/scan"); }
    } catch (err) { setError(err.message); setSubmitting(false); }
  };

  const isOCRing  = ocrStatus === "loading";
  const canSubmit = form.barcode && form.productName && form.ingredients && !submitting && !analyzing;

  if (submitted && !analyzing) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 gap-6">
      <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center">
        <CheckCircle size={36} className="text-brand-400" />
      </div>
      <div className="text-center">
        <h2 className="font-display text-[28px] text-white mb-2">Product Added!</h2>
        <p className="font-body text-[14px]" style={{color:"rgba(255,255,255,0.4)"}}>Thank you for contributing to IngredientIQ.</p>
      </div>
      <Loader2 size={20} className="animate-spin text-brand-400" />
      <p className="text-[12px] font-mono" style={{color:"rgba(255,255,255,0.25)"}}>Analyzing for you…</p>
    </div>
  );

  return (
    <div className="px-5 pt-10 pb-10 lg:pt-12 min-h-screen">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] font-mono mb-8 -ml-1 hover:text-brand-400 transition-colors"
        style={{color:"rgba(255,255,255,0.3)"}}>
        <ChevronLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
            <Package size={18} className="text-brand-400" />
          </div>
          <span className="section-label">Product not in database</span>
        </div>
        <h2 className="font-display text-[28px] lg:text-[34px] text-white leading-tight mb-2">Add this product</h2>
        <p className="font-body text-[13px] leading-relaxed" style={{color:"rgba(255,255,255,0.35)"}}>
          Help improve IngredientIQ by adding products that aren't in the database yet.
        </p>
      </div>

      {/* On desktop: 2-col layout */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5 flex flex-col gap-4">
            <div>
              <label className="section-label block mb-2">Barcode *</label>
              <input className="input-field font-mono" placeholder="e.g. 8901234567890"
                value={form.barcode} onChange={handleField("barcode")} readOnly={!!prefillBarcode} />
              {prefillBarcode && <p className="text-[11px] font-mono text-brand-400/60 mt-1">✓ Pre-filled from barcode scan</p>}
            </div>
            <div>
              <label className="section-label block mb-2">Product Name *</label>
              <input className="input-field" placeholder="e.g. Kellogg's Corn Flakes"
                value={form.productName} onChange={handleField("productName")} />
            </div>
            <div>
              <label className="section-label block mb-2">Brand Name</label>
              <input className="input-field" placeholder="e.g. Kellogg's"
                value={form.brandName} onChange={handleField("brandName")} />
            </div>
          </div>
          <ImageUploadField id="front-image" label="Front Product Image" hint="Tap to take photo or upload"
            value={frontImage} onChange={setFrontImage} />
        </div>

        <div className="flex flex-col gap-5 mt-5 lg:mt-0">
          <div>
            <ImageUploadField id="ingredient-image" label="Ingredients Label Image" hint="Photo of the ingredient list"
              value={ingredientImage} onChange={(v) => { setIngredientImage(v); setOcrDone(false); }} />
            {ingredientImage && !ocrDone && (
              <button onClick={runOCR} disabled={isOCRing}
                className="btn-primary mt-3 flex items-center justify-center gap-2 text-[14px] py-3">
                {isOCRing ? <><Loader2 size={16} className="animate-spin"/>Reading… {progress}%</> : <><ScanLine size={16}/>Extract Ingredients from Image</>}
              </button>
            )}
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="section-label">Ingredients Text *</label>
              {ocrDone && <span className="text-[11px] font-mono text-brand-400/60 flex items-center gap-1"><CheckCircle size={10}/> OCR extracted</span>}
            </div>
            <textarea className="input-field min-h-[120px] resize-none text-[13px] leading-relaxed"
              placeholder="Water, Sugar, Modified Corn Starch, Salt, Natural Flavors..."
              value={form.ingredients} onChange={handleField("ingredients")} />
            <p className="text-[11px] font-mono mt-1" style={{color:"rgba(255,255,255,0.2)"}}>You can edit the extracted text or type it manually.</p>
          </div>

          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
            style={{background:"rgba(251,191,36,0.06)", border:"0.5px solid rgba(251,191,36,0.15)"}}>
            <AlertTriangle size={14} className="text-amber-400/60 flex-shrink-0 mt-0.5" />
            <p className="text-[12px] font-mono leading-relaxed" style={{color:"rgba(255,255,255,0.3)"}}>
              Contributed products are reviewed before appearing for all users. Your name is not shown publicly.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl" style={{background:"rgba(239,68,68,0.08)", border:"0.5px solid rgba(239,68,68,0.2)"}}>
              <p className="text-[13px] font-mono text-red-400">{error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary flex items-center justify-center gap-2">
            {submitting || analyzing
              ? <><Loader2 size={18} className="animate-spin"/>{submitting ? "Saving product…" : "Analyzing…"}</>
              : <><Package size={18}/>Submit & Analyze</>}
          </button>
          <p className="text-center text-[11px] font-mono" style={{color:"rgba(255,255,255,0.15)"}}>Fields marked * are required</p>
        </div>
      </div>
    </div>
  );
}
