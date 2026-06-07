import { useNavigate } from "react-router-dom";
import { ScanLine, ShieldCheck, Zap, ChevronRight, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col px-5 pt-16 pb-8">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 mb-6">
            <ShieldCheck size={13} className="text-brand-400" />
            <span className="text-[12px] font-mono text-brand-400">Personalized food safety</span>
          </div>
          <h1 className="font-display text-[44px] leading-[1.05] text-surface-50 mb-4">
            Know what's<br /><span className="text-brand-400">safe for you.</span>
          </h1>
          <p className="font-body text-[16px] text-surface-200/60 leading-relaxed max-w-xs">
            Scan any ingredient list and get an instant analysis personalized to your health conditions and allergies.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-10">
          {[
            { icon: ScanLine,    text: "Camera scan or paste text" },
            { icon: ShieldCheck, text: "Personalized to your conditions" },
            { icon: Zap,         text: "AI-powered in seconds" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-brand-400" />
              </div>
              <span className="font-body text-[14px] text-surface-200/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-2xl px-4 py-3">
              <ShieldCheck size={15} className="text-brand-400 flex-shrink-0" />
              <span className="text-[13px] font-body text-brand-400">
                Hey {user.name.split(" ")[0]} — ready to scan
              </span>
            </div>
            <button onClick={() => navigate("/scan")} className="btn-primary flex items-center justify-center gap-2">
              <ScanLine size={18} /> Scan Ingredients
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/register")} className="btn-primary flex items-center justify-center gap-2">
              Get Started <ChevronRight size={18} />
            </button>
            <button onClick={() => navigate("/login")} className="btn-secondary flex items-center justify-center gap-2">
              <LogIn size={16} /> Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}
