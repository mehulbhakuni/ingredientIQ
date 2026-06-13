import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ShieldX, ChevronLeft, ScanLine, AlertTriangle, Info, Package } from "lucide-react";

const VERDICT_CONFIG = {
  safe:    { icon: ShieldCheck, label: "Safe for you",         text: "text-brand-400", ring: "#4ade80", border: "rgba(34,197,94,0.2)",  bg: "rgba(34,197,94,0.06)"  },
  caution: { icon: ShieldAlert, label: "Consume with caution", text: "text-amber-400", ring: "#fbbf24", border: "rgba(251,191,36,0.2)",  bg: "rgba(251,191,36,0.06)" },
  avoid:   { icon: ShieldX,     label: "Avoid this product",   text: "text-red-400",   ring: "#f87171", border: "rgba(248,113,113,0.2)", bg: "rgba(248,113,113,0.06)" },
};
const SEVERITY_CONFIG = {
  high:   { label:"High risk", bg:"rgba(239,68,68,0.08)",   text:"text-red-400",   border:"rgba(239,68,68,0.2)",   icon:ShieldX       },
  medium: { label:"Moderate",  bg:"rgba(251,191,36,0.08)",  text:"text-amber-400", border:"rgba(251,191,36,0.2)",  icon:AlertTriangle  },
  low:    { label:"Low risk",  bg:"rgba(59,130,246,0.08)",  text:"text-blue-400",  border:"rgba(59,130,246,0.2)",  icon:Info           },
};

function ScoreArc({ score, verdict }) {
  const cfg = VERDICT_CONFIG[verdict]||VERDICT_CONFIG.caution;
  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-36 h-20">
        <svg width="144" height="80" viewBox="0 0 144 80">
          <path d="M 12 72 A 60 60 0 0 1 132 72" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
          {score!=null&&(
            <path d="M 12 72 A 60 60 0 0 1 132 72" fill="none" stroke={cfg.ring} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(score/100)*188.5} 188.5`} style={{transition:"stroke-dasharray 0.8s ease"}}/>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`font-display text-[36px] leading-none ${cfg.text}`}>{score!=null?score:"—"}</span>
          <span className="text-[11px] font-mono mt-0.5" style={{color:"rgba(255,255,255,0.25)"}}>/ 100</span>
        </div>
      </div>
      <p className={`font-mono text-[12px] mt-2 ${cfg.text}`}>Health Score</p>
    </div>
  );
}

export default function Result() {
  const {state}  = useLocation();
  const navigate = useNavigate();
  if (!state?.result) { navigate("/scan",{replace:true}); return null; }

  const {result,ingredients} = state;
  const verdict     = result.verdict||"caution";
  const config      = VERDICT_CONFIG[verdict]||VERDICT_CONFIG.caution;
  const VerdictIcon = config.icon;
  const score       = result.healthScore??result.health_score??null;
  const productName = result.productName||"Unknown Product";

  return (
    <div className="px-5 pt-10 pb-10 min-h-screen">
      <button onClick={()=>navigate("/scan")}
        className="flex items-center gap-1.5 text-[13px] font-mono mb-6 -ml-1 hover:text-brand-400 transition-colors"
        style={{color:"rgba(255,255,255,0.3)"}}>
        <ChevronLeft size={16}/> Back to scan
      </button>

      {/* On desktop: 2-col layout */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">

        {/* Left col */}
        <div>
          {/* Product name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 glass-card">
              {result.imageUrl && !result.imageUrl.startsWith("data:")
                ? <img src={result.imageUrl} alt={productName} className="w-full h-full object-cover rounded-xl"/>
                : <Package size={18} style={{color:"rgba(255,255,255,0.3)"}}/>
              }
            </div>
            <div>
              <p className="section-label mb-0.5">Product</p>
              <h2 className="font-display text-[20px] text-white leading-tight">{productName}</h2>
              {result.brandName&&<p className="text-[13px] font-mono text-brand-400/60 mt-0.5">{result.brandName}</p>}
            </div>
          </div>

          {/* Score + verdict card */}
          <div className="rounded-3xl mb-4 overflow-hidden" style={{background:config.bg, border:`0.5px solid ${config.border}`, backdropFilter:"blur(12px)"}}>
            <ScoreArc score={score} verdict={verdict}/>
            <div className="px-5 py-4 flex items-center gap-3" style={{borderTop:`0.5px solid ${config.border}`}}>
              <VerdictIcon size={20} className={config.text}/>
              <div className="flex-1">
                <p className={`font-display text-[18px] ${config.text} leading-tight`}>{config.label}</p>
                <p className="font-body text-[13px] mt-0.5 leading-relaxed" style={{color:"rgba(255,255,255,0.5)"}}>{result.summary}</p>
              </div>
            </div>
            {result.safe_note&&verdict!=="avoid"&&(
              <div className="px-5 pb-4">
                <p className="text-[12px] font-mono" style={{color:"rgba(255,255,255,0.3)"}}>{result.safe_note}</p>
              </div>
            )}
          </div>

          {/* Raw ingredients toggle */}
          <details className="glass-card mb-4 group">
            <summary className="px-4 py-3 text-[13px] font-mono cursor-pointer list-none flex items-center justify-between"
              style={{color:"rgba(255,255,255,0.3)"}}>
              View full ingredient list
              <span className="group-open:rotate-180 transition-transform text-[10px]">▾</span>
            </summary>
            <div className="px-4 pb-4">
              <p className="text-[12px] font-mono leading-relaxed whitespace-pre-wrap" style={{color:"rgba(255,255,255,0.3)"}}>{ingredients}</p>
            </div>
          </details>
        </div>

        {/* Right col */}
        <div>
          {/* Flagged ingredients */}
          {result.flagged?.length>0 ? (
            <div className="mb-4">
              <p className="section-label mb-3">{result.flagged.length} flagged ingredient{result.flagged.length!==1?"s":""}</p>
              <div className="flex flex-col gap-3">
                {result.flagged.map((item,i)=>{
                  const sev=SEVERITY_CONFIG[item.severity]||SEVERITY_CONFIG.medium, SevIcon=sev.icon;
                  return (
                    <div key={i} className="rounded-2xl p-4 animate-fade-up"
                      style={{background:sev.bg, border:`0.5px solid ${sev.border}`, animationDelay:`${i*60}ms`, animationFillMode:"both"}}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body font-medium text-[15px] text-white/90 capitalize">{item.ingredient}</span>
                        <span className={`tag text-[11px] ${sev.text}`} style={{background:"rgba(255,255,255,0.05)", border:`0.5px solid ${sev.border}`}}>
                          <SevIcon size={11}/>{sev.label}
                        </span>
                      </div>
                      <p className="text-[13px] font-body leading-relaxed" style={{color:"rgba(255,255,255,0.5)"}}>{item.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="glass-card p-4 mb-4 flex items-center gap-3">
              <ShieldCheck size={18} className="text-brand-400 flex-shrink-0"/>
              <p className="text-[14px] font-body" style={{color:"rgba(255,255,255,0.5)"}}>No problematic ingredients for your profile.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={()=>navigate("/scan")} className="btn-primary flex items-center justify-center gap-2">
              <ScanLine size={18}/> Scan Another Product
            </button>
            <button onClick={()=>navigate("/history")} className="btn-secondary text-[14px]">View Food Diary</button>
          </div>
        </div>
      </div>
    </div>
  );
}
