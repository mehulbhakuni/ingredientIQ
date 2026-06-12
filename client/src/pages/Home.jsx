import { useNavigate } from "react-router-dom";
import { ScanLine, ShieldCheck, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function ScanMockup() {
  return (
    <div className="relative flex justify-center items-center py-6 select-none">
      <div className="absolute w-40 h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)", top: "-10px", right: "30px" }} />
      <div className="absolute w-28 h-28 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", bottom: "0px", left: "20px" }} />

      <div className="absolute left-2 top-6 animate-float-slow">
        <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/25 rounded-full px-2.5 py-1 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
          <span className="text-[10px] font-mono text-brand-400 whitespace-nowrap">✓ Celiac safe</span>
        </div>
      </div>

      <div className="absolute right-1 top-12 animate-float-mid">
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 rounded-full px-2.5 py-1 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          <span className="text-[10px] font-mono text-amber-400 whitespace-nowrap">⚠ Contains soy</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float-slow" style={{ animationDelay: "0.8s" }}>
        <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/25 rounded-full px-2.5 py-1 backdrop-blur-sm">
          <span className="text-[10px] font-mono text-brand-400 whitespace-nowrap">🟢 86 / 100</span>
        </div>
      </div>

      <div className="relative w-32 h-48 rounded-[22px] border border-white/10 overflow-hidden flex flex-col items-center justify-center"
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-b-lg bg-black/40 z-10" />
        <p className="absolute top-5 text-[8px] font-mono tracking-widest text-white/20 uppercase">Ingredients</p>

        <div className="relative w-20 h-14 mt-2">
          <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-brand-400 rounded-tl" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-brand-400 rounded-tr" />
          <span className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-brand-400 rounded-bl" />
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-brand-400 rounded-br" />
          <div className="scan-beam-home absolute left-1 right-1 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #22c55e, transparent)", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }} />
        </div>

        <div className="flex gap-[2px] items-end h-6 mt-3 px-4 w-full justify-center">
          {[3,5,2,4,5,2,3,4,2,5,3,2,4,5,2,3].map((h, i) => (
            <div key={i} className="w-[2px] rounded-sm flex-shrink-0"
              style={{ height: `${h * 4}px`, background: "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col px-5 pt-12 pb-8 relative overflow-hidden">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full"
          style={{ width: "280px", height: "280px", background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)", top: "-60px", right: "-60px" }} />
        <div className="absolute rounded-full"
          style={{ width: "220px", height: "220px", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)", top: "120px", left: "-60px" }} />
        <div className="absolute rounded-full"
          style={{ width: "180px", height: "180px", background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)", bottom: "100px", right: "0px" }} />
      </div>

      <div className="flex-1 flex flex-col relative z-10">

        <div className="inline-flex items-center gap-2 self-start bg-brand-500/10 border border-brand-500/20 rounded-full px-3.5 py-1.5 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse flex-shrink-0" />
          <span className="text-[11px] font-mono text-brand-400">Personalized food safety</span>
        </div>

        <h1 className="font-display text-[40px] leading-[1.05] text-surface-50 mb-3 tracking-tight">
          Know what's<br />
          <span style={{ background: "linear-gradient(90deg, #4ade80, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            safe for you.
          </span>
        </h1>

        <p className="font-body text-[14px] leading-relaxed mb-2 max-w-xs"
          style={{ color: "rgba(240,244,240,0.45)" }}>
          AI-powered ingredient analysis personalized to your health conditions and allergies.
        </p>

        <ScanMockup />

        {user && (
          <div className="flex items-center gap-2 mb-3 px-4 py-2.5 rounded-2xl"
            style={{ background: "rgba(34,197,94,0.08)", border: "0.5px solid rgba(34,197,94,0.2)" }}>
            <ShieldCheck size={14} className="text-brand-400 flex-shrink-0" />
            <span className="text-[13px] font-body text-brand-400">
              Hey {user.name.split(" ")[0]} — ready to scan
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {user ? (
            <button
              onClick={() => navigate("/scan")}
              className="relative w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-body font-semibold text-white active:scale-95 transition-all duration-150"
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                boxShadow: "0 4px 28px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <ScanLine size={18} /> Scan Ingredients
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/register")}
                className="relative w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-body font-semibold text-white active:scale-95 transition-all duration-150"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  boxShadow: "0 4px 28px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                <ScanLine size={18} /> Scan Ingredients
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-body active:scale-95 transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <LogIn size={16} /> Sign In
              </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {["Camera + Barcode", "Personalized analysis", "Food diary"].map((f) => (
            <span key={f} className="text-[11px] font-mono px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}