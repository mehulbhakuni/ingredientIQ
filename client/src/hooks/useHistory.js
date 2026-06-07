import { useState, useCallback } from "react";

const KEY = "iq_history";
const MAX = 30;

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const addScan = useCallback((scan) => {
    setHistory((prev) => {
      const updated = [
        { ...scan, id: Date.now(), scannedAt: new Date().toISOString() },
        ...prev,
      ].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  return { history, addScan, clearHistory };
}
