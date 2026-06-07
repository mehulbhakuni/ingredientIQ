import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronLeft, ScanLine, AlertTriangle, Info, Package, Barcode, Camera } from "lucide-react";

const VERDICT_CONFIG = {
  safe:    { icon: ShieldCheck, label: "Safe for you",         bg: "bg-brand-500/10", border: "border-brand-500/20", text: "text-brand-400",  ring: "#4ade80" },
  caution: { icon: ShieldAlert, label: "Consume with caution", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400",  ring: "#fbbf24" },
  avoid:   { icon: ShieldX,     label: "Avoid this product",   bg: "bg-red-500/10",   border: "border-red-500/20",   text: "text-red-400",    ring: "#f87171" },
};

const SEVERITY_CONFIG = {
  high:   { label: "High risk", bg: "bg-red-500/10",   text: "text-red-400",   border: "border-red-500/20",   icon: ShieldX      },
  medium: { label: "Moderate",  bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", icon: AlertTriangle },
  low:    { label: "Low risk",  bg: "bg-blue-500/10",  text: "text-blue-400",  border: "border-blue-500/20",  icon: Info         },
};

const SCAN_TYPE_LABEL = {
  barcode:     { icon: Barcode, label: "Barcode Scan" },
  ocr:         { icon: Camera,  label: "Ingredient Scan" },
  paste:       { icon: Package, label: "Pasted" },
};

function ScoreArc({ score, verdict }) {
  const cfg  = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.caution;
  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-36 h-20">
        <svg width="144" height="80" viewBox="0 0 144 80">
          <path d="M 12 72 A 60 60 0 0 1 132 72" fill="none" stroke="#1c2a1c" strokeWidth="10" strokeLinecap="round" />
          {score !== null && (
            <path d="M 12 72 A 60 60 0 0 1 132 72" fill="none"
              stroke={cfg.ring} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 188.5} 188.5`}
              style={{ transition: "stroke-dasharray 0.8s ease" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`font-display text-[36px] leading-none ${cfg.text}`}>
            {score !== null && score !== undefined ? score : "—"}
          </span>
          <span className="text-[11px] font-mono text-surface-200/30 mt-0.5">/ 100</span>
        </div>
      </div>
      <p className={`font-mono text-[12px] mt-2 ${cfg.text}`}>Health Score</p>
    </div>
  );
}

export default function Result() {
  const { state }  = useLocation();
  const navigate   = useNavigate();

  if (!state?.result) { navigate("/scan", { replace: true }); return null; }

  const { result, ingredients } = state;
  const verdict     = result.verdict || "caution";
  const config      = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.caution;
  const VerdictIcon = config.icon;
  const score       = result.healthScore ?? result.health_score ?? null;
  const productName = result.productName || "Unknown Product";
  const brandName   = result.brandName   || "";
  const imageUrl    = result.imageUrl    || "";
  const scanType    = result.scanType    || "paste";
  const stCfg       = SCAN_TYPE_LABEL[scanType] || SCAN_TYPE_LABEL.paste;
  const StIcon      = stCfg.icon;

  return (
    <div className="px-5 pt-10 pb-10 min-h-screen flex flex-col">
      {/* Back */}
      <button onClick={() => navigate("/scan")}
        className="flex items-center gap-1.5 text-[13px] font-mono text-surface-200/40 hover:text-brand-400 transition-colors mb-6 -ml-1">
        <ChevronLeft size={16} /> Back to scan
      </button>

      {/* Product hero */}
      <div className="bg-surface-800 rounded-3xl overflow-hidden mb-4">
        {/* Product image */}
        {imageUrl && (
          <div className="w-full h-44 bg-white flex items-center justify-center overflow-hidden">
            <img src={imageUrl} alt={productName}
              className="h-full w-full object-contain p-3"
              onError={(e) => { e.target.parentElement.style.display = "none"; }} />
          </div>
        )}
        {/* Product info */}
        <div className="px-4 pt-4 pb-3 flex items-start gap-3">
          {!imageUrl && (
            <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center flex-shrink-0">
              <Package size={20} className="text-surface-200/30" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-[20px] text-surface-50 leading-tight truncate">{productName}</h2>
            {brandName && <p className="text-[13px] font-mono text-brand-400/70 mt-0.5">{brandName}</p>}
            <span className={`inline-flex items-center gap-1 mt-2 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-700 text-surface-200/40`}>
              <StIcon size={10} />{stCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Score arc + verdict */}
      <div className={`${config.bg} border ${config.border} rounded-3xl`}>
        <ScoreArc score={score} verdict={verdict} />
        <div className={`border-t ${config.border} px-5 py-4 flex items-center gap-3`}>
          <VerdictIcon size={20} className={config.text} />
          <div className="flex-1">
            <p className={`font-display text-[18px] ${config.text} leading-tight`}>{config.label}</p>
            <p className="font-body text-[13px] text-surface-50/60 mt-0.5 leading-relaxed">{result.summary}</p>
          </div>
        </div>
        {result.safe_note && verdict !== "avoid" && (
          <div className="px-5 pb-4">
            <p className="text-[12px] font-mono text-surface-200/40 leading-relaxed">{result.safe_note}</p>
          </div>
        )}
      </div>

      {/* Flagged ingredients */}
      {result.flagged?.length > 0 ? (
        <div className="mt-5">
          <p className="section-label mb-3">
            {result.flagged.length} flagged ingredient{result.flagged.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-col gap-3">
            {result.flagged.map((item, i) => {
              const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.medium;
              const SevIcon = sev.icon;
              return (
                <div key={i}
                  className="bg-surface-800 border border-surface-800 rounded-2xl p-4 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body font-medium text-[15px] text-surface-50 capitalize">{item.ingredient}</span>
                    <span className={`tag text-[11px] ${sev.bg} ${sev.text} border ${sev.border} gap-1`}>
                      <SevIcon size={11} />{sev.label}
                    </span>
                  </div>
                  <p className="text-[13px] font-body text-surface-200/60 leading-relaxed">{item.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-surface-800 rounded-2xl p-4 mt-5 flex items-center gap-3">
          <ShieldCheck size={18} className="text-brand-400 flex-shrink-0" />
          <p className="text-[14px] font-body text-surface-200/60">No problematic ingredients for your profile.</p>
        </div>
      )}

      {/* Raw ingredients collapsible */}
      <details className="bg-surface-800 rounded-2xl mt-5 group">
        <summary className="px-4 py-3 text-[13px] font-mono text-surface-200/40 cursor-pointer list-none flex items-center justify-between">
          View full ingredient list
          <span className="group-open:rotate-180 transition-transform text-[10px]">▾</span>
        </summary>
        <div className="px-4 pb-4">
          <p className="text-[12px] font-mono text-surface-200/40 leading-relaxed whitespace-pre-wrap">{ingredients}</p>
        </div>
      </details>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-8">
        <button onClick={() => navigate("/scan")} className="btn-primary flex items-center justify-center gap-2">
          <ScanLine size={18} /> Scan Another Product
        </button>
        <button onClick={() => navigate("/history")} className="btn-secondary text-[14px]">
          View Food Diary
        </button>
      </div>
    </div>
  );
}
