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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col px-5 pt-16 pb-8">
      <div className="mb-10">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6">
          <ShieldCheck size={24} className="text-brand-400" />
        </div>
        <h1 className="font-display text-[36px] text-surface-50 leading-tight mb-2">Create account</h1>
        <p className="font-body text-[15px] text-surface-200/50">Your health profile syncs across devices</p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
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
          <input
            name="password" type="password" className="input-field"
            placeholder="Min. 6 characters"
            value={form.password} onChange={handle}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-4">
          <p className="text-[13px] font-mono text-red-400">{error}</p>
        </div>
      )}

      <button onClick={submit} disabled={loading} className="btn-primary flex items-center justify-center gap-2 mb-4">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
        {loading ? "Creating account…" : "Create Account"}
      </button>

      <p className="text-center text-[13px] font-mono text-surface-200/30">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-400 hover:underline">Sign in</Link>
      </p>

      <p className="text-center text-[11px] font-mono text-surface-200/20 mt-4 px-4">
        Your health data is stored securely and never sold or shared.
      </p>
    </div>
  );
}
