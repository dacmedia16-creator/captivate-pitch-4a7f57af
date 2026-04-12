import { useRole, UserRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

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
  const { session, loading } = useAuth();
  const { role } = useRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={roleRedirects[role]} replace />;
  }

  return <>{children}</>;
}
