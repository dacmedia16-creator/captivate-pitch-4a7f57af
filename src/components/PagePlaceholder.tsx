import { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function PagePlaceholder({ title, description, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mb-6">
        <Icon className="h-8 w-8 text-accent" />
      </div>
      <h1 className="text-3xl font-bold font-display tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md">{description}</p>
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-4 h-24 premium-shadow" />
        ))}
      </div>
    </div>
  );
}
