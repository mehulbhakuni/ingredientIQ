import { useState, useCallback } from "react";

const KEY = "iq_profile";

export function useProfile() {
  const [profile, setProfileState] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const saveProfile = useCallback((data) => {
    localStorage.setItem(KEY, JSON.stringify(data));
    setProfileState(data);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(KEY);
    setProfileState(null);
  }, []);

  return { profile, saveProfile, clearProfile };
}
