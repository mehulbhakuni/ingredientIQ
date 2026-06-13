import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShieldCheck, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../utils/api";

const CONDITIONS = ["Celiac Disease","Diabetes (Type 1)","Diabetes (Type 2)","IBD / Crohn's","IBS","Lactose Intolerance","Hypertension","Kidney Disease","GERD / Acid Reflux","High Cholesterol","Thyroid Disorder","PCOS"];
const ALLERGIES  = ["Peanuts","Tree Nuts","Milk / Dairy","Eggs","Wheat / Gluten","Soy","Fish","Shellfish","Sesame","Corn","Sulfites","Mustard"];
const DIETS      = ["Vegan","Vegetarian","Keto","Halal","Kosher","Paleo","Low FODMAP","Low Sodium","Low Sugar"];

function TagSelector({ label, options, selected, onChange }) {
  const toggle = (item) =>
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item]);
  return (
    <div className="mb-6">
      <p className="section-label mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = selected.includes(item);
          return (
            <button key={item} onClick={() => toggle(item)}
              className={`tag transition-all duration-150 text-[12px] ${
                active
                  ? "text-brand-400"
                  : "text-white/40 hover:text-white/60"
              }`}
              style={active
                ? { background:"rgba(34,197,94,0.12)", border:"0.5px solid rgba(34,197,94,0.3)" }
                : { background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.08)" }
              }>
              {active && <X size={11} />}{item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [conditions, setConditions] = useState(user?.profile?.conditions || []);
  const [allergies,  setAllergies]  = useState(user?.profile?.allergies  || []);
  const [diets,      setDiets]      = useState(user?.profile?.diets      || []);
  const [custom,     setCustom]     = useState(user?.profile?.custom     || "");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const hasAny = conditions.length || allergies.length || diets.length || custom.trim();

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await updateProfile({ conditions, allergies, diets, custom: custom.trim() });
      await refreshUser();
      navigate("/scan");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-5 pt-10 pb-8 lg:pt-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className="section-label block mb-2">Health profile</span>
          <h2 className="font-display text-[30px] lg:text-[36px] text-white leading-tight">
            {user?.name?.split(" ")[0]}'s profile
          </h2>
          <p className="text-[13px] font-mono mt-1" style={{ color:"rgba(255,255,255,0.3)" }}>{user?.email}</p>
        </div>
        <button onClick={() => { logout(); navigate("/"); }}
          className="flex items-center gap-1.5 text-[12px] font-mono mt-2 transition-colors hover:text-red-400"
          style={{ color:"rgba(255,255,255,0.2)" }}>
          <LogOut size={13} /> Sign out
        </button>
      </div>

      {/* On desktop: 2 column layout */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="glass-card p-5 mb-5 lg:mb-0">
          <TagSelector label="Conditions" options={CONDITIONS} selected={conditions} onChange={setConditions} />
          <TagSelector label="Allergies"  options={ALLERGIES}  selected={allergies}  onChange={setAllergies} />
        </div>
        <div className="flex flex-col gap-5">
          <div className="glass-card p-5">
            <TagSelector label="Dietary restrictions" options={DIETS} selected={diets} onChange={setDiets} />
            <div>
              <p className="section-label mb-3">Anything else?</p>
              <textarea className="input-field min-h-[90px] resize-none"
                placeholder="e.g. avoid MSG, low-oxalate diet..."
                value={custom} onChange={(e) => setCustom(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-2xl" style={{ background:"rgba(239,68,68,0.08)", border:"0.5px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[13px] font-mono text-red-400">{error}</p>
            </div>
          )}

          <button onClick={handleSave} disabled={!hasAny || saving}
            className="btn-primary flex items-center justify-center gap-2">
            {saving ? "Saving…" : <><ShieldCheck size={18} />Save Profile<ChevronRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
