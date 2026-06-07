import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, ShieldAlert, ShieldX,
  Trash2, ScanLine, Loader2,
  ChevronRight, AlertTriangle, Package,
  Barcode, Camera, ClipboardPaste
} from "lucide-react";
import { getScans, deleteScan, clearScans } from "../utils/api";

// ── Config maps ───────────────────────────────────────────

const VERDICT = {
  safe:    { icon: ShieldCheck, label: "Safe",               scoreColor: "text-brand-400", scoreBg: "bg-brand-500/10", border: "border-brand-500/20" },
  caution: { icon: ShieldAlert, label: "Consume Cautiously", scoreColor: "text-amber-400", scoreBg: "bg-amber-500/10", border: "border-amber-500/20" },
  avoid:   { icon: ShieldX,     label: "Avoid",              scoreColor: "text-red-400",   scoreBg: "bg-red-500/10",   border: "border-red-500/20"   },
};

const SCAN_TYPE = {
  barcode: { icon: Barcode,         label: "Barcode Scan",     bg: "bg-brand-500/8  text-brand-400/60"  },
  ocr:     { icon: Camera,          label: "Ingredient Scan",  bg: "bg-surface-700  text-surface-200/40" },
  paste:   { icon: ClipboardPaste,  label: "Pasted",           bg: "bg-surface-700  text-surface-200/40" },
};

// ── Helpers ───────────────────────────────────────────────

function scoreEmoji(score) {
  if (score === null || score === undefined) return "⚪";
  if (score >= 70) return "🟢";
  if (score >= 35) return "🟡";
  return "🔴";
}

function formatDate(iso) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)   return `${diffDays} days ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: diffDays > 365 ? "numeric" : undefined });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function groupByDate(scans) {
  const groups = {};
  scans.forEach((s) => {
    const label = formatDate(s.createdAt);
    (groups[label] ??= []).push(s);
  });
  return Object.entries(groups);
}

// ── Score ring ────────────────────────────────────────────

function ScoreRing({ score, verdict }) {
  const cfg       = VERDICT[verdict] || VERDICT.caution;
  const radius    = 20;
  const circ      = 2 * Math.PI * radius;
  const fill      = score != null ? (score / 100) * circ : 0;
  const ringColor = verdict === "safe" ? "#4ade80" : verdict === "caution" ? "#fbbf24" : "#f87171";

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#1c2a1c" strokeWidth="4" />
        <circle cx="28" cy="28" r={radius} fill="none"
          stroke={score != null ? ringColor : "#2a3a2a"}
          strokeWidth="4"
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-[13px] leading-none ${cfg.scoreColor}`}>
          {score != null ? score : "—"}
        </span>
        {score != null && <span className="font-mono text-[8px] text-surface-200/30 mt-0.5">/ 100</span>}
      </div>
    </div>
  );
}

// ── Scan card ─────────────────────────────────────────────

function ScanCard({ scan, onDelete, onClick }) {
  const verdict   = scan.verdict || "caution";
  const vcfg      = VERDICT[verdict] || VERDICT.caution;
  const VIcon     = vcfg.icon;
  const flagCount = scan.flagged?.length || 0;
  const stcfg     = SCAN_TYPE[scan.scanType] || SCAN_TYPE.paste;
  const StIcon    = stcfg.icon;

  return (
    <button
      onClick={onClick}
      className={`w-full bg-surface-800 border ${vcfg.border} rounded-2xl p-4 text-left
                  flex items-center gap-4 active:scale-[0.98] transition-all duration-150 group`}
    >
      <ScoreRing score={scan.healthScore} verdict={verdict} />

      <div className="flex-1 min-w-0">
        {/* Product name */}
        <p className="font-display text-[15px] text-surface-50 truncate leading-tight mb-1.5">
          {scan.productName || "Unknown Product"}
        </p>

        {/* Badge row: score + verdict + scan type */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Score badge */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${vcfg.scoreBg} ${vcfg.scoreColor}`}>
            {scoreEmoji(scan.healthScore)}
            {scan.healthScore != null ? `${scan.healthScore}/100` : "—"}
          </span>

          {/* Verdict badge */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full ${vcfg.scoreBg} ${vcfg.scoreColor}`}>
            <VIcon size={10} />
            {vcfg.label}
          </span>

          {/* Scan type badge */}
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-surface-700 text-surface-200/40">
            <StIcon size={10} />
            {stcfg.label}
          </span>
        </div>

        {/* Meta: time + flag count */}
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[11px] font-mono text-surface-200/25">{formatTime(scan.createdAt)}</span>
          {flagCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-surface-200/40">
              <AlertTriangle size={9} />{flagCount} flagged
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-brand-400/40">
              <ShieldCheck size={9} />No flags
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(scan._id); }}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/10 text-surface-200/30 hover:text-red-400 transition-all"
        >
          <Trash2 size={13} />
        </button>
        <ChevronRight size={16} className="text-surface-200/20" />
      </div>
    </button>
  );
}

// ── Stats bar ─────────────────────────────────────────────

function StatsBar({ scans }) {
  const withScore = scans.filter((s) => s.healthScore != null);
  const avgScore  = withScore.length
    ? Math.round(withScore.reduce((a, s) => a + s.healthScore, 0) / withScore.length)
    : null;

  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {[
        { label: "Avg Score", value: avgScore ?? "—", color: "text-surface-50"  },
        { label: "Safe",      value: scans.filter((s) => s.verdict === "safe").length,    color: "text-brand-400" },
        { label: "Caution",   value: scans.filter((s) => s.verdict === "caution").length, color: "text-amber-400" },
        { label: "Avoid",     value: scans.filter((s) => s.verdict === "avoid").length,   color: "text-red-400"   },
      ].map(({ label, value, color }) => (
        <div key={label} className="bg-surface-800 rounded-2xl p-3 text-center">
          <p className={`font-display text-[20px] ${color}`}>{value}</p>
          <p className="text-[10px] font-mono text-surface-200/30 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function History() {
  const navigate          = useNavigate();
  const [scans,   setScans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getScans()
      .then(({ scans }) => setScans(scans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try { await deleteScan(id); setScans((p) => p.filter((s) => s._id !== id)); }
    catch { /* silent */ }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all scan history?")) return;
    try { await clearScans(); setScans([]); } catch { /* silent */ }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-brand-400" />
    </div>
  );

  return (
    <div className="px-5 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="section-label block mb-2">Food diary</span>
          <h2 className="font-display text-[32px] text-surface-50 leading-tight">Scan History</h2>
        </div>
        {scans.length > 0 && (
          <button onClick={handleClearAll}
            className="flex items-center gap-1.5 text-[12px] font-mono text-surface-200/20 hover:text-red-400 transition-colors mt-2">
            <Trash2 size={12} /> Clear all
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-4">
          <p className="text-[13px] font-mono text-red-400">{error}</p>
        </div>
      )}

      {scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 mt-24">
          <div className="w-20 h-20 rounded-3xl bg-surface-800 flex items-center justify-center">
            <Package size={32} className="text-surface-200/20" />
          </div>
          <div className="text-center">
            <p className="font-body text-[15px] text-surface-200/50 mb-1">No scans yet</p>
            <p className="text-[12px] font-mono text-surface-200/20">Your food diary will appear here</p>
          </div>
          <button onClick={() => navigate("/scan")} className="btn-primary w-auto px-8">
            Scan Your First Product
          </button>
        </div>
      ) : (
        <>
          <StatsBar scans={scans} />
          <div className="flex flex-col gap-6">
            {groupByDate(scans).map(([dateLabel, group]) => (
              <div key={dateLabel}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="section-label">{dateLabel}</span>
                  <div className="flex-1 h-px bg-surface-800" />
                  <span className="text-[11px] font-mono text-surface-200/20">
                    {group.length} scan{group.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {group.map((scan) => (
                    <ScanCard
                      key={scan._id}
                      scan={scan}
                      onDelete={handleDelete}
                      onClick={() => navigate("/result", {
                        state: { result: scan, ingredients: scan.ingredients },
                      })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/scan")} className="btn-primary mt-8 flex items-center justify-center gap-2">
            <ScanLine size={18} /> Scan Another Product
          </button>
        </>
      )}
    </div>
  );
}
