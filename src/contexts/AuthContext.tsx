"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  isAdmin: boolean;
  loadingAuth: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  loadingAuth: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    checkSavedPin();
  }, []);

  async function checkSavedPin() {
    try {
      const savedPin = localStorage.getItem("ijoba_admin_pin");
      if (!savedPin) {
        setLoadingAuth(false);
        return;
      }

      // Verificação SEGURA no servidor, sem vazar a senha real
      const { data, error } = await supabase.rpc('verificar_pin', { p_pin: savedPin });

      if (!error && data === true) {
        setIsAdmin(true);
      } else {
        localStorage.removeItem("ijoba_admin_pin");
        setIsAdmin(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAuth(false);
    }
  }

  async function login(pin: string) {
    try {
      // Verificação SEGURA no servidor
      const { data, error } = await supabase.rpc('verificar_pin', { p_pin: pin });

      if (!error && data === true) {
        localStorage.setItem("ijoba_admin_pin", pin);
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  function logout() {
    localStorage.removeItem("ijoba_admin_pin");
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ isAdmin, loadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
