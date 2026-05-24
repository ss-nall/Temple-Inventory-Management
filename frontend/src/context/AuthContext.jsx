import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("temple_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("temple_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("temple_token", token);
    } else {
      localStorage.removeItem("temple_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("temple_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("temple_user");
    }
  }, [user]);

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const googleLogin = async (payload) => {
    const { data } = await api.post("/auth/google", payload);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      googleLogin,
      register,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
