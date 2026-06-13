import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, ShieldX, Trash2, ScanLine, Loader2, ChevronRight, AlertTriangle, Package, Barcode, Camera, ClipboardPaste } from "lucide-react";
import { getScans, deleteScan, clearScans } from "../utils/api";

const VERDICT = {
  safe:    { icon: ShieldCheck, label: "Safe",               scoreColor: "text-brand-400", ring: "#4ade80", border: "rgba(34,197,94,0.2)",  bg: "rgba(34,197,94,0.06)"  },
  caution: { icon: ShieldAlert, label: "Consume Cautiously", scoreColor: "text-amber-400", ring: "#fbbf24", border: "rgba(251,191,36,0.2)",  bg: "rgba(251,191,36,0.06)" },
  avoid:   { icon: ShieldX,     label: "Avoid",              scoreColor: "text-red-400",   ring: "#f87171", border: "rgba(248,113,113,0.2)", bg: "rgba(248,113,113,0.06)" },
};
const SCAN_TYPE = {
  barcode: { icon: Barcode,        label: "Barcode Scan"     },
  ocr:     { icon: Camera,         label: "Ingredient Scan"  },
  paste:   { icon: ClipboardPaste, label: "Pasted"           },
};

function scoreEmoji(s) { return s == null ? "⚪" : s >= 70 ? "🟢" : s >= 35 ? "🟡" : "🔴"; }
function formatDate(iso) {
  const d = new Date(iso), diff = Math.floor((Date.now()-d)/86400000);
  if (diff===0) return "Today"; if (diff===1) return "Yesterday"; if (diff<7) return `${diff} days ago`;
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}
function formatTime(iso) { return new Date(iso).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}); }
function groupByDate(scans) {
  const g={}; scans.forEach(s=>{ const l=formatDate(s.createdAt); (g[l]??=[]).push(s); }); return Object.entries(g);
}

function ScoreRing({ score, verdict }) {
  const cfg = VERDICT[verdict]||VERDICT.caution;
  const r=20, circ=2*Math.PI*r, fill=score!=null?(score/100)*circ:0;
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={score!=null?cfg.ring:"rgba(255,255,255,0.08)"}
          strokeWidth="4" strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 0.6s ease"}} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-[13px] leading-none ${cfg.scoreColor}`}>{score!=null?score:"—"}</span>
        {score!=null&&<span className="font-mono text-[8px] mt-0.5" style={{color:"rgba(255,255,255,0.2)"}}>/ 100</span>}
      </div>
    </div>
  );
}

function ScanCard({ scan, onDelete, onClick }) {
  const verdict=scan.verdict||"caution", vcfg=VERDICT[verdict]||VERDICT.caution, VIcon=vcfg.icon;
  const flagCount=scan.flagged?.length||0, stcfg=SCAN_TYPE[scan.scanType]||SCAN_TYPE.paste, StIcon=stcfg.icon;
  return (
    <button onClick={onClick}
      className="w-full text-left flex items-center gap-4 p-4 rounded-2xl transition-all duration-150 active:scale-[0.98] group"
      style={{ background:vcfg.bg, border:`0.5px solid ${vcfg.border}`, backdropFilter:"blur(8px)" }}>
      <ScoreRing score={scan.healthScore} verdict={verdict} />
      <div className="flex-1 min-w-0">
        <p className="font-display text-[14px] text-white/90 truncate leading-tight mb-1.5">
          {scan.productName || "Unknown Product"}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${vcfg.scoreColor}`}
            style={{ background:"rgba(255,255,255,0.05)" }}>
            {scoreEmoji(scan.healthScore)} {scan.healthScore!=null?`${scan.healthScore}/100`:"—"}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${vcfg.scoreColor}`}
            style={{ background:"rgba(255,255,255,0.05)" }}>
            <VIcon size={10}/>{vcfg.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full"
            style={{ background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)" }}>
            <StIcon size={10}/>{stcfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] font-mono" style={{color:"rgba(255,255,255,0.2)"}}>{formatTime(scan.createdAt)}</span>
          {flagCount>0
            ? <span className="inline-flex items-center gap-1 text-[11px] font-mono" style={{color:"rgba(255,255,255,0.3)"}}><AlertTriangle size={9}/>{flagCount} flagged</span>
            : <span className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-400/50"><ShieldCheck size={9}/>No flags</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={(e)=>{e.stopPropagation();onDelete(scan._id);}}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all"
          style={{color:"rgba(255,255,255,0.2)"}}>
          <Trash2 size={13}/>
        </button>
        <ChevronRight size={16} style={{color:"rgba(255,255,255,0.15)"}}/>
      </div>
    </button>
  );
}

function StatsBar({ scans }) {
  const ws=scans.filter(s=>s.healthScore!=null);
  const avg=ws.length?Math.round(ws.reduce((a,s)=>a+s.healthScore,0)/ws.length):null;
  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {[
        {label:"Avg Score", value:avg??"—", color:"text-white/80"},
        {label:"Safe",    value:scans.filter(s=>s.verdict==="safe").length,    color:"text-brand-400"},
        {label:"Caution", value:scans.filter(s=>s.verdict==="caution").length, color:"text-amber-400"},
        {label:"Avoid",   value:scans.filter(s=>s.verdict==="avoid").length,   color:"text-red-400"},
      ].map(({label,value,color})=>(
        <div key={label} className="glass-card p-3 text-center">
          <p className={`font-display text-[20px] ${color}`}>{value}</p>
          <p className="text-[10px] font-mono mt-0.5" style={{color:"rgba(255,255,255,0.25)"}}>{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function History() {
  const navigate=useNavigate();
  const [scans,setScans]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{ getScans().then(({scans})=>setScans(scans)).catch(e=>setError(e.message)).finally(()=>setLoading(false)); },[]);

  const handleDelete=async(id)=>{ try{ await deleteScan(id); setScans(p=>p.filter(s=>s._id!==id)); }catch{} };
  const handleClearAll=async()=>{ if(!window.confirm("Clear all scan history?")) return; try{ await clearScans(); setScans([]); }catch{} };

  if(loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={28} className="animate-spin text-brand-400"/></div>;

  return (
    <div className="px-5 pt-10 pb-8 lg:pt-12">
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="section-label block mb-2">Food diary</span>
          <h2 className="font-display text-[30px] lg:text-[36px] text-white leading-tight">Scan History</h2>
        </div>
        {scans.length>0&&(
          <button onClick={handleClearAll} className="flex items-center gap-1.5 text-[12px] font-mono mt-2 hover:text-red-400 transition-colors"
            style={{color:"rgba(255,255,255,0.2)"}}>
            <Trash2 size={12}/> Clear all
          </button>
        )}
      </div>

      {error&&<div className="px-4 py-3 rounded-2xl mb-4" style={{background:"rgba(239,68,68,0.08)",border:"0.5px solid rgba(239,68,68,0.2)"}}><p className="text-[13px] font-mono text-red-400">{error}</p></div>}

      {scans.length===0 ? (
        <div className="flex flex-col items-center justify-center gap-5 mt-24">
          <div className="w-20 h-20 rounded-3xl glass-card flex items-center justify-center">
            <Package size={32} style={{color:"rgba(255,255,255,0.15)"}}/>
          </div>
          <div className="text-center">
            <p className="font-body text-[15px] mb-1" style={{color:"rgba(255,255,255,0.4)"}}>No scans yet</p>
            <p className="text-[12px] font-mono" style={{color:"rgba(255,255,255,0.2)"}}>Your food diary will appear here</p>
          </div>
          <button onClick={()=>navigate("/scan")} className="btn-primary w-auto px-8">Scan Your First Product</button>
        </div>
      ) : (
        <>
          <StatsBar scans={scans}/>
          <div className="flex flex-col gap-6">
            {groupByDate(scans).map(([dateLabel,group])=>(
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="section-label">{dateLabel}</span>
                  <div className="flex-1 h-px" style={{background:"rgba(255,255,255,0.06)"}}/>
                  <span className="text-[11px] font-mono" style={{color:"rgba(255,255,255,0.2)"}}>{group.length} scan{group.length!==1?"s":""}</span>
                </div>
                {/* On desktop: 2-col grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {group.map(scan=>(
                    <ScanCard key={scan._id} scan={scan} onDelete={handleDelete}
                      onClick={()=>navigate("/result",{state:{result:scan,ingredients:scan.ingredients}})}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={()=>navigate("/scan")} className="btn-primary mt-8 flex items-center justify-center gap-2">
            <ScanLine size={18}/> Scan Another Product
          </button>
        </>
      )}
    </div>
  );
}
