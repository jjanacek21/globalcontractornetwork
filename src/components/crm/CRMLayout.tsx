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
          {/* Top Bar */}
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts, leads, jobs..."
                  className="pl-9 h-9 bg-muted/50 border-0"
                />
              </div>
            </div>
            <div className="ml-auto">
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
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
