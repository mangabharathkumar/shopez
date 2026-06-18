import { useCallback, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api/http";
import { AuthContext } from "./authStore";

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("shopezUser"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("shopezToken"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("shopezToken")));

  const persistSession = useCallback((nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem("shopezUser", JSON.stringify(nextUser));
    localStorage.setItem("shopezToken", nextToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("shopezUser");
    localStorage.removeItem("shopezToken");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem("shopezToken")) return null;

    const { data } = await api.get("/auth/me");
    setUser(data.user);
    localStorage.setItem("shopezUser", JSON.stringify(data.user));
    return data.user;
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await refreshProfile();
        if (active && profile) setUser(profile);
      } catch {
        if (active) logout();
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [logout, refreshProfile, token]);

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      persistSession(data.user, data.token);
      return data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }, [persistSession]);

  const register = useCallback(async (payload) => {
    try {
      const { data } = await api.post("/auth/register", payload);
      persistSession(data.user, data.token);
      return data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error), { cause: error });
    }
  }, [persistSession]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
    refreshProfile,
    setUser,
  }), [loading, login, logout, refreshProfile, register, token, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

