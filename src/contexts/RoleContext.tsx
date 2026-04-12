import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";

export type UserRole = "super_admin" | "admin" | "agent";

// Map DB roles to frontend roles
function mapRole(appRole: AppRole | null): UserRole {
  if (appRole === "super_admin") return "super_admin";
  if (appRole === "agency_admin") return "admin";
  return "agent";
}

interface RoleContextType {
  role: UserRole;
  userName: string;
  companyName: string;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { profile, appRole, tenantName } = useAuth();

  const role = mapRole(appRole);
  const userName = profile?.full_name || "Usuário";
  const companyName = tenantName || (role === "super_admin" ? "Listing Studio AI" : "Sem empresa");

  return (
    <RoleContext.Provider value={{ role, userName, companyName }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
}
