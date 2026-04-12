import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "super_admin" | "admin" | "agent";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  userName: string;
  companyName: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("agent");

  const userName = role === "super_admin" ? "Admin Global" : role === "admin" ? "Maria Silva" : "João Santos";
  const companyName = role === "super_admin" ? "Listing Studio AI" : "Imobiliária Premium";

  return (
    <RoleContext.Provider value={{ role, setRole, userName, companyName }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
}
