import { Bell, Search, LogOut } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { userName, companyName } = useRole();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-4 bg-background/70 backdrop-blur-xl px-4 shadow-[0_1px_3px_0_hsl(216_50%_12%/0.04)]">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
        <Search className="h-3.5 w-3.5" />
      </Button>

      <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
        <Bell className="h-3.5 w-3.5" />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-accent" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 pl-3 border-l border-border/40 hover:opacity-80 transition-opacity">
            <div className="flex h-7 w-7 items-center justify-center rounded-full gold-gradient text-primary-foreground text-[11px] font-bold ring-2 ring-accent/20">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-medium leading-none">{userName}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{companyName}</span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={signOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
