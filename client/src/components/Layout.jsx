import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ScanLine, User, Clock, Home, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/",        icon: Home,     label: "Home"    },
  { to: "/scan",    icon: ScanLine, label: "Scan"    },
  { to: "/history", icon: Clock,    label: "History" },
  { to: "/profile", icon: User,     label: "Profile" },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isResultPage = pathname === "/result";
  const hideNav = isAuthPage;

  return (
    <div className="min-h-screen bg-surface-900 bg-orbs">

      {/* ── Desktop sidebar ── */}
      {!hideNav && user && (
        <aside className="hidden lg:flex fixed left-0 top-0 h-full w-60 flex-col z-40"
          style={{ background: "rgba(6,13,26,0.8)", borderRight: "0.5px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>

          {/* Logo */}
          <div className="px-6 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.15)", border: "0.5px solid rgba(34,197,94,0.3)" }}>
                <ShieldCheck size={16} className="text-brand-400" />
              </div>
              <span className="font-display text-[17px] text-white">
                Ingredient<span className="text-brand-400">IQ</span>
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-body transition-all duration-150 ${
                    isActive
                      ? "text-brand-400 bg-brand-500/10"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}>
                <Icon size={18} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User + signout */}
          <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-brand-400 flex-shrink-0"
                style={{ background: "rgba(34,197,94,0.12)", border: "0.5px solid rgba(34,197,94,0.25)" }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-body text-white/70 truncate">{user.name}</p>
                <p className="text-[10px] font-mono text-white/25 truncate">{user.email}</p>
              </div>
              <button onClick={() => { logout(); navigate("/"); }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main content ── */}
      <main className={`min-h-screen ${!hideNav && user ? "lg:ml-60" : ""} ${!hideNav && !isResultPage && user ? "pb-24 lg:pb-0" : ""}`}>
        <div className="max-w-3xl mx-auto relative z-10">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      {!hideNav && user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom"
          style={{ background: "rgba(6,13,26,0.92)", borderTop: "0.5px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center justify-around px-2 pt-2 max-w-md mx-auto">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                    isActive ? "text-brand-400" : "text-white/25 hover:text-white/50"
                  }`}>
                <Icon size={22} strokeWidth={1.8} />
                <span className="text-[10px] font-mono">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
