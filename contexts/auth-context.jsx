"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Include depositAccount on reload
          const normalized = {
            customerId: parsed?.customerId ?? parsed?.id ?? null,
            icNumber: parsed?.icNumber ?? "",
            name: parsed?.name ?? "Customer",
            email: parsed?.email ?? "",
            phone: parsed?.phone ?? "",
            depositAccount:
              parsed?.depositAccount ??
              parsed?.DepositeAcct ??
              parsed?.raw?.DepositeAcct ??
              "",
            raw: parsed?.raw ?? parsed?.customerData ?? null,
          };
          setUser(normalized);
          localStorage.setItem("currentUser", JSON.stringify(normalized));
        } catch (error) {
          console.error("Error parsing saved user:", error);
          localStorage.removeItem("currentUser");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    const normalized = {
      customerId: userData?.customerId ?? userData?.id ?? null,
      icNumber: userData?.icNumber ?? "",
      name: userData?.name ?? "Customer",
      email: userData?.email ?? "",
      phone: userData?.phone ?? "",
      depositAccount: userData?.depositAccount ?? "",
      raw: userData?.raw ?? userData?.customerData ?? null,
    };
    setUser(normalized);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(normalized));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("userPoints_") || key.startsWith("claimedRewards_")) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    const normalized = {
      customerId: merged?.customerId ?? merged?.id ?? null,
      icNumber: merged?.icNumber ?? "",
      name: merged?.name ?? "Customer",
      email: merged?.email ?? "",
      phone: merged?.phone ?? "",
      depositAccount: merged?.depositAccount ?? "",
      raw: merged?.raw ?? null,
    };
    setUser(normalized);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(normalized));
    }
  };

  const getCustomerId = () => user?.customerId ?? null;
  const getDepositAccount = () => user?.depositAccount ?? "";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user?.customerId,
        getCustomerId,
        getDepositAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
