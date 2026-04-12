import { useRole, UserRole } from "@/contexts/RoleContext";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

const roleRedirects: Record<UserRole, string> = {
  super_admin: "/admin/dashboard",
  admin: "/company/dashboard",
  agent: "/dashboard",
};

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role } = useRole();

  if (!allowedRoles.includes(role)) {
    return <Navigate to={roleRedirects[role]} replace />;
  }

  return <>{children}</>;
}
