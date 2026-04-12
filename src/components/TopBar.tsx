import { Bell, Search } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { userName, companyName, role } = useRole();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-lg px-4">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
        <Search className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
      </Button>

      <div className="flex items-center gap-3 pl-2 border-l border-border/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {userName.charAt(0)}
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-medium leading-none">{userName}</span>
          <span className="text-[11px] text-muted-foreground leading-none mt-0.5">{companyName}</span>
        </div>
      </div>
    </header>
  );
}
