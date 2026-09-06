import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("sc_token") || null);
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);

  // Setup Axios default Authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("sc_token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("sc_token");
    }
  }, [token]);

  // Fetch initial profile if token exists, and load demo accounts
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Fetch demo accounts for one-click autofill
        const demoRes = await axios.get("http://localhost:5000/api/auth/demo-accounts");
        if (demoRes.data?.accounts) {
          setDemoAccounts(demoRes.data.accounts);
        }
      } catch (err) {
        console.warn("Could not fetch demo accounts:", err);
      }

      const storedToken = localStorage.getItem("sc_token");
      if (storedToken) {
        try {
          const res = await axios.get("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.data?.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn("Token validation failed or expired, clearing session.");
          setToken(null);
          setUser(null);
          localStorage.removeItem("sc_token");
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });
    if (res.data?.token && res.data?.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error("Invalid login response");
  };

  const register = async (userData) => {
    const res = await axios.post("http://localhost:5000/api/auth/register", userData);
    if (res.data?.token && res.data?.user) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error("Invalid registration response");
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("sc_token");
  };

  // Quick switch role or switch demo account
  const quickSwitchDemoUser = async (roleToSelect) => {
    const target = demoAccounts.find((a) => a.role === roleToSelect);
    if (target) {
      return await login(target.email, target.password);
    }
    throw new Error(`Demo account for role '${roleToSelect}' not found`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        demoAccounts,
        login,
        register,
        logout,
        quickSwitchDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
