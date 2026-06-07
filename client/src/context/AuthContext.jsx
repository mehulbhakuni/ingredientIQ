import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem("iq_token");
    if (!token) { setLoading(false); return; }

    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("iq_token"))
      .finally(() => setLoading(false));
  }, []);

  const saveAuth = useCallback((token, userData) => {
    localStorage.setItem("iq_token", token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("iq_token");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await getMe();
      setUser(user);
      return user;
    } catch { logout(); }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, saveAuth, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
