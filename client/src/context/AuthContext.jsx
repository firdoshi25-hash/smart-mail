import { useEffect, useMemo, useState } from "react";
import api from "../api";
import AuthContext from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const [ready, setReady] = useState(!localStorage.getItem("token"));

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setReady(true);
    };
    window.addEventListener("smart-mail:auth-expired", handleExpired);
    return () => window.removeEventListener("smart-mail:auth-expired", handleExpired);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    let active = true;
    api.get("/auth/profile")
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        } else {
          console.error("Could not verify the saved Smart Mail session:", error.message);
        }
      })
      .finally(() => active && setReady(true));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    login(session) {
      localStorage.setItem("token", session.token);
      localStorage.setItem("user", JSON.stringify(session.user));
      setUser(session.user);
    },
    logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
