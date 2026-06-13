import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Loader2, ShieldCheck } from "lucide-react";
import { register } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { setError("Please fill in all fields."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      const { token, user } = await register(form.name, form.email, form.password);
      saveAuth(token, user);
      navigate("/profile", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width:"300px",height:"300px",background:"radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%)",top:"-80px",right:"-80px" }} />
        <div className="absolute rounded-full" style={{ width:"200px",height:"200px",background:"radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)",bottom:"0",left:"-60px" }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
            style={{ background:"rgba(34,197,94,0.12)", border:"0.5px solid rgba(34,197,94,0.25)" }}>
            <ShieldCheck size={26} className="text-brand-400" />
          </div>
          <h1 className="font-display text-[32px] text-white leading-tight mb-1">Create account</h1>
          <p className="font-body text-[14px]" style={{ color:"rgba(255,255,255,0.4)" }}>Your health profile syncs across devices</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex flex-col gap-4 mb-5">
            <div>
              <label className="section-label block mb-2">Name</label>
              <input name="name" className="input-field" placeholder="Mehul" value={form.name} onChange={handle} />
            </div>
            <div>
              <label className="section-label block mb-2">Email</label>
              <input name="email" type="email" className="input-field" placeholder="you@email.com" value={form.email} onChange={handle} />
            </div>
            <div>
              <label className="section-label block mb-2">Password</label>
              <input name="password" type="password" className="input-field" placeholder="Min. 6 characters"
                value={form.password} onChange={handle} onKeyDown={(e) => e.key === "Enter" && submit()} />
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-2xl" style={{ background:"rgba(239,68,68,0.08)", border:"0.5px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[13px] font-mono text-red-400">{error}</p>
            </div>
          )}

          <button onClick={submit} disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>

        <p className="text-center text-[13px] font-mono mt-4" style={{ color:"rgba(255,255,255,0.25)" }}>
          Already have an account?{" "}
          <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-[11px] font-mono mt-2" style={{ color:"rgba(255,255,255,0.15)" }}>
          Your health data is stored securely and never sold or shared.
        </p>
      </div>
    </div>
  );
}
