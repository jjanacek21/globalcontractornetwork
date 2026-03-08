import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Users, Briefcase, FileText,
  Factory, CalendarDays, Map, FileStack, Presentation, Crown,
  Shield, Settings, HelpCircle, ChevronRight, Inbox, Brain,
  Phone, Bot, Eye, Home, HardHat,
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
  { title: "Client Management", url: "/member/crm/contacts", icon: Users },
  { title: "Jobs", url: "/member/crm/jobs", icon: Briefcase },
  { title: "Estimates", url: "/member/crm/estimates", icon: FileText },
  { title: "Production", url: "/member/crm/production", icon: Factory },
  { title: "Calendar", url: "/member/crm/calendar", icon: CalendarDays },
  { title: "Storm Canvas Pro", url: "/member/crm/field-map", icon: Map },
  { title: "Smart Docs", url: "/member/crm/smart-docs", icon: FileStack },
  { title: "Presentations", url: "/member/crm/presentations", icon: Presentation },
  { title: "Permit Expediter", url: "/member/crm/permit-expediter", icon: Crown },
];

const followUpItems = [
  { title: "Inbox", url: "/member/crm/follow-up/inbox", icon: Inbox },
  { title: "Unmatched", url: "/member/crm/follow-up/unmatched", icon: Eye },
  { title: "AI Queue", url: "/member/crm/follow-up/ai-queue", icon: Brain },
  { title: "Call Center", url: "/member/crm/follow-up/call-center", icon: Phone },
  { title: "AI Agent", url: "/member/crm/follow-up/ai-agent", icon: Bot },
];

const insuranceItems = [
  { title: "Claims", url: "/member/crm/insurance/claims", icon: Shield },
  { title: "Scope Intelligence", url: "/member/crm/insurance/scope-intelligence", icon: Brain },
];

const portalNav = [
  { title: "Crew Portal", url: "/member/crm/crew-portal", icon: HardHat },
  { title: "Homeowner Portal", url: "/member/crm/homeowner-portal", icon: Home },
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

  const renderNavItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === "/member/crm"}
          className={({ isActive: active }) =>
            `group relative transition-all duration-200 ${
              active
                ? "bg-sidebar-accent/60 text-sidebar-accent-foreground font-medium backdrop-blur-sm before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-r-full before:bg-sidebar-primary"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground hover:backdrop-blur-sm"
            }`
          }
        >
          <item.icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="crm-glass-sidebar">
      <SidebarHeader className="border-b border-sidebar-border/30 p-4">
        <NavLink to="/member/crm" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary shadow-lg shadow-sidebar-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <LayoutDashboard className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight">GCN-CRM</span>
              <span className="text-[10px] text-sidebar-foreground/50">Contractor Suite</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] tracking-[0.15em]">MAIN</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainNav.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-[0.15em] w-full hover:text-sidebar-foreground/70 transition-colors duration-200">
              {!collapsed && <span>Follow Up Hub</span>}
              {!collapsed && <ChevronRight className="w-3 h-3 ml-auto transition-transform duration-300 data-[state=open]:rotate-90" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>{followUpItems.map(renderNavItem)}</SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-[0.15em] w-full hover:text-sidebar-foreground/70 transition-colors duration-200">
              {!collapsed && <span>Insurance</span>}
              {!collapsed && <ChevronRight className="w-3 h-3 ml-auto transition-transform duration-300 data-[state=open]:rotate-90" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu>{insuranceItems.map(renderNavItem)}</SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[10px] tracking-[0.15em]">PORTALS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{[...portalNav, ...bottomNav].map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/30 p-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold shadow-lg shadow-sidebar-primary/30">
              {profileName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="absolute -inset-0.5 rounded-full border border-sidebar-primary/40 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-sidebar-foreground truncate">{profileName || "User"}</span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate">{companyName || "Corporate"}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
