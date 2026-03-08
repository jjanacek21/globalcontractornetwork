import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Users, Briefcase, FileText,
  Factory, CalendarDays, Map, FileStack, Presentation, Crown,
  PhoneCall, Shield, Star, Gift, Settings, HelpCircle, ChevronRight,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const mainNav = [
  { title: "Dashboard", url: "/member/crm", icon: LayoutDashboard },
  { title: "Pipeline", url: "/member/crm/pipeline", icon: TrendingUp },
  { title: "Contacts", url: "/member/crm/contacts", icon: Users },
  { title: "Jobs", url: "/member/crm/jobs", icon: Briefcase },
  { title: "Estimates", url: "/member/crm/estimates", icon: FileText },
  { title: "Production", url: "/member/crm/production", icon: Factory },
  { title: "Calendar", url: "/member/crm/calendar", icon: CalendarDays },
  { title: "Storm Canvas Pro", url: "/member/crm/field-map", icon: Map },
  { title: "Smart Docs", url: "/member/crm/smart-docs", icon: FileStack },
  { title: "Presentations", url: "/member/crm/presentations", icon: Presentation },
  { title: "Permit Expediter", url: "/permit-queens/dashboard", icon: Crown },
];

const followUpItems = [
  { title: "Call Queue", url: "/member/crm/follow-up/calls", icon: PhoneCall },
  { title: "Tasks", url: "/member/crm/follow-up/tasks", icon: FileText },
];

const insuranceItems = [
  { title: "Claims", url: "/member/crm/insurance/claims", icon: Shield },
  { title: "Supplements", url: "/supplement-kings", icon: FileText },
];

const portalNav = [
  { title: "Surveys", url: "/member/crm/surveys", icon: Star },
  { title: "Referrals", url: "/member/crm/referrals", icon: Gift },
];

const bottomNav = [
  { title: "Help", url: "/member/crm/help", icon: HelpCircle },
  { title: "Settings", url: "/member/crm/settings", icon: Settings },
];

export function CRMSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [profileName, setProfileName] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", session.user.id).maybeSingle();
      if (profile) setProfileName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
      const { data: contractor } = await supabase.from("contractor_profiles").select("company_name").eq("user_id", session.user.id).maybeSingle();
      if (contractor) setCompanyName(contractor.company_name);
    };
    loadProfile();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <NavLink to="/member/crm" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary">
            <LayoutDashboard className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">PITCH</span>
              <span className="text-[10px] text-sidebar-foreground/60">Roofing CRM</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {/* Main Nav */}
        <SidebarGroup>
          <SidebarGroupLabel>MAIN</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/member/crm"}
                      className={({ isActive: active }) =>
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
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

        {/* Follow Up Hub */}
        <SidebarGroup>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider w-full hover:text-sidebar-foreground">
              {!collapsed && <span>Follow Up Hub</span>}
              {!collapsed && <ChevronRight className="w-3 h-3 ml-auto transition-transform data-[state=open]:rotate-90" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                {followUpItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive: active }) =>
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Insurance */}
        <SidebarGroup>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider w-full hover:text-sidebar-foreground">
              {!collapsed && <span>Insurance</span>}
              {!collapsed && <ChevronRight className="w-3 h-3 ml-auto transition-transform data-[state=open]:rotate-90" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>
                {insuranceItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive: active }) =>
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                        }
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Portals */}
        <SidebarGroup>
          <SidebarGroupLabel>PORTALS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...portalNav, ...bottomNav].map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive: active }) =>
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
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

      {/* Footer with user */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold">
            {profileName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-sidebar-foreground truncate">{profileName || "User"}</span>
              <span className="text-[10px] text-sidebar-foreground/60 truncate">{companyName || "Corporate"}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
