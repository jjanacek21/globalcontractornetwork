import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Users, Brain, Home, Zap } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/roofscope", icon: LayoutDashboard },
  { title: "Estimates", url: "/roofscope/estimates", icon: FileText },
  { title: "Customers", url: "/roofscope/customers", icon: Users },
  { title: "AI Analyzer", url: "/roofscope/analyzer", icon: Brain },
];

function RoofScopeSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/30 p-4">
        <div className="flex items-center gap-2">
          <NavLink to="/roofscope" className="flex items-center gap-2 group flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary shadow-lg shadow-sidebar-primary/30 transition-transform duration-300 group-hover:scale-110">
              <Zap className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-foreground tracking-tight">RoofScope</span>
                <span className="text-[10px] text-sidebar-foreground/50">AI Estimator</span>
              </div>
            )}
          </NavLink>
          <NavLink
            to="/member/dashboard"
            title="Back to Main Dashboard"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground transition-colors duration-200 shrink-0"
          >
            <Home className="w-4 h-4" />
          </NavLink>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] tracking-[0.15em]">NAVIGATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/roofscope"}
                      className={({ isActive }) =>
                        `group relative transition-all duration-200 ${
                          isActive
                            ? "bg-sidebar-accent/60 text-sidebar-accent-foreground font-medium backdrop-blur-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-r-full before:bg-sidebar-primary"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function RoofScopeLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <RoofScopeSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 bg-background/80 backdrop-blur-md px-4 border-b border-border/30">
            <SidebarTrigger className="shrink-0" />
            <span className="text-sm font-medium text-muted-foreground">RoofScope AI Estimator</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
