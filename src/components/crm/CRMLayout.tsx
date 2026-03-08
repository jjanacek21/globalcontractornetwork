import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CRMSidebar } from "./CRMSidebar";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CRMLayoutProps {
  children: ReactNode;
}

export const CRMLayout = ({ children }: CRMLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <CRMSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          {/* Glassmorphic Top Bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 bg-background/80 backdrop-blur-md px-4 border-b border-border/30 shadow-[0_1px_12px_0_hsl(var(--primary)/0.06)]">
            <SidebarTrigger className="shrink-0 transition-transform duration-200 hover:scale-110" />
            <div className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
                <Input
                  placeholder="Search contacts, leads, jobs..."
                  className="pl-9 h-9 bg-muted/40 border-border/30 backdrop-blur-sm transition-all duration-300 focus:bg-background/90 focus:shadow-[0_0_0_2px_hsl(var(--primary)/0.15)] focus:border-primary/30"
                />
              </div>
            </div>
            <div className="ml-auto">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative transition-transform duration-200 hover:scale-110 hover:bg-accent/10">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
