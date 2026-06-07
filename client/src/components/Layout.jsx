import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ScanLine, User, Clock, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/",        icon: Home,     label: "Home" },
  { to: "/scan",    icon: ScanLine, label: "Scan" },
  { to: "/history", icon: Clock,    label: "History" },
  { to: "/profile", icon: User,     label: "Profile" },
];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user }     = useAuth();
  const hideNav      = pathname === "/result" || pathname === "/login" || pathname === "/register";

  return (
    <div className="min-h-screen flex flex-col bg-surface-900 max-w-md mx-auto relative">
      <main className={`flex-1 overflow-y-auto ${hideNav ? "" : "pb-24"}`}>
        {children}
      </main>

      {!hideNav && user && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface-900/95 backdrop-blur border-t border-surface-800 safe-bottom z-50">
          <div className="flex items-center justify-around px-2 pt-2">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 ${
                    isActive ? "text-brand-400" : "text-surface-200/40 hover:text-surface-200/70"
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
