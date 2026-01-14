import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Ruler,
  FileText,
  Presentation,
  Building2,
  Map,
  Kanban,
  Trophy,
} from "lucide-react";
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
} from "@/components/ui/sidebar";

const navigation = [
  { title: "Dashboard", url: "/crm/dashboard", icon: LayoutDashboard },
  { title: "Contacts", url: "/crm/contacts", icon: Users },
  { title: "Pipeline", url: "/crm/pipeline", icon: Kanban },
  { title: "Field Map", url: "/crm/field-map", icon: Map },
  { title: "Measurements", url: "/crm/measurements", icon: Ruler },
  { title: "Estimates", url: "/crm/estimates", icon: FileText },
  { title: "Presentations", url: "/crm/presentations", icon: Presentation },
  { title: "Rewards", url: "/crm/rewards", icon: Trophy },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">GCN</span>
            <span className="text-xs text-sidebar-foreground/60">CRM Portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/crm/dashboard"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
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
