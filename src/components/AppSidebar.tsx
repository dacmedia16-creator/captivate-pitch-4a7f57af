import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Presentation,
  PlusCircle,
  UserCircle,
  BarChart3,
  Palette,
  FileText,
  Globe,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole, UserRole } from "@/contexts/RoleContext";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const superAdminNav: NavItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Imobiliárias", url: "/admin/tenants", icon: Building2 },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", url: "/company/dashboard", icon: LayoutDashboard },
  { title: "Equipe", url: "/company/team", icon: Users },
  { title: "Marca", url: "/company/branding", icon: Palette },
  { title: "Templates", url: "/company/templates", icon: FileText },
  { title: "Marketing", url: "/company/marketing", icon: Megaphone },
  { title: "Portais", url: "/company/portals", icon: Globe },
  { title: "Configurações", url: "/company/settings", icon: Settings },
];

const agentNav: NavItem[] = [
  { title: "Meu Painel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Apresentações", url: "/presentations", icon: Presentation },
  { title: "Nova Apresentação", url: "/presentations/new", icon: PlusCircle },
  { title: "Meu Perfil", url: "/profile", icon: UserCircle },
  { title: "Estudo de Mercado", url: "/market-study", icon: BarChart3 },
];

const navByRole: Record<UserRole, NavItem[]> = {
  super_admin: superAdminNav,
  admin: adminNav,
  agent: agentNav,
};

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin Imobiliária",
  agent: "Corretor",
};

export function AppSidebar() {
  const { role } = useRole();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = navByRole[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gold-gradient">
            <Sparkles className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-accent-foreground tracking-tight">
                Listing Studio
              </span>
              <span className="text-[10px] font-medium text-sidebar-primary tracking-widest uppercase">
                AI
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {!collapsed && (
          <div className="px-3 mb-2">
            <div className="rounded-lg bg-sidebar-accent px-3 py-2 text-xs font-medium text-sidebar-accent-foreground">
              {roleLabels[role]}
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] tracking-widest uppercase">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2">
            <Globe className="h-4 w-4 text-sidebar-primary" />
            <span className="text-[11px] text-sidebar-foreground/70">
              Powered by AI
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
