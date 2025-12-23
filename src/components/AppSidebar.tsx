import { LayoutDashboard, Users, Calendar, Settings, FileText, Shield, ScrollText, BookOpen, History, GraduationCap, Palette, Plug, ChevronDown, BookMarked, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useOrganizationSettings } from "@/integrations/supabase/hooks/useOrganizationSettings";
import { cn } from "../lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainMenuItems = [
  {
    title: "Visão Geral",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Turmas",
    url: "/cohorts",
    icon: Calendar,
  },
  {
    title: "Matrículas",
    url: "/enrollments",
    icon: GraduationCap,
  },
  {
    title: "Tutoriais",
    url: "/tutorials",
    icon: BookMarked,
  },
];

const settingsMenuItems = [
  {
    title: "Configurações Gerais",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Marca",
    url: "/branding",
    icon: Palette,
  },
  {
    title: "Integrações",
    url: "/integrations",
    icon: Plug,
  },
  {
    title: "Usuários",
    url: "/users",
    icon: Shield,
  },
  {
    title: "Logs de Auditoria",
    url: "/audit-logs",
    icon: ScrollText,
  },
  {
    title: "Histórico de Importações",
    url: "/import-history",
    icon: History,
  },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const { userRole } = useAuth();
  const location = useLocation();
  const { data: orgSettings } = useOrganizationSettings();

  // Check if any settings submenu item is active
  const isSettingsActive = settingsMenuItems.some(item => location.pathname === item.url);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  // Only admins can see settings menu
  const canAccessSettings = userRole === 'admin';

  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar/80 backdrop-blur-xl transition-all duration-300 ease-in-out">
      <SidebarContent className="pt-8">
        <div className={cn("transition-all duration-300", open ? "px-6 pb-6" : "px-2 pb-6 flex justify-center")}>
          {orgSettings?.logo_url ? (
            <div className="flex items-center justify-center">
              <img
                src={orgSettings.logo_url}
                alt={orgSettings.organization_name || "Logo"}
                className={open ? "h-12 w-auto object-contain" : "h-8 w-8 object-contain rounded-lg"}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Bio-System Logo with Glow */}
              <div
                className={cn(
                  "rounded-xl bg-gradient-bio flex items-center justify-center glow-cyan shrink-0 transition-all duration-300",
                  open ? "w-10 h-10" : "w-8 h-8"
                )}
                style={{
                  background: 'linear-gradient(135deg, hsl(172 66% 50%) 0%, hsl(199 89% 48%) 100%)',
                  boxShadow: '0 0 25px hsl(172 66% 50% / 0.4)'
                }}
              >
                <span className={cn("font-bold text-white transition-all", open ? "text-lg" : "text-sm")}>O</span>
              </div>
              {open && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <h1 className="font-bold text-foreground text-sm tracking-tight leading-none mb-1">
                    {orgSettings?.organization_name || "Optical Experience"}
                  </h1>
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-widest leading-none opacity-80">
                    Bio-System
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-overline px-4 mb-2">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Main menu items */}
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-2 transition-all duration-200 hover:bg-sidebar-accent/50 group"
                      activeClassName="sidebar-item-active"
                    >
                      <item.icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                      {open && <span className="text-sm font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Configurações (Collapsible menu) */}
              {canAccessSettings && (
                <Collapsible
                  open={settingsOpen}
                  onOpenChange={setSettingsOpen}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 transition-all duration-200 hover:bg-sidebar-accent/50 group",
                          isSettingsActive && "sidebar-item-active"
                        )}
                      >
                        <Settings className="h-4 w-4 transition-transform group-hover:rotate-45" />
                        {open && <span className="text-sm font-medium">Configurações</span>}
                        {open && (
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
                      <SidebarMenuSub className="ml-4 mt-1 border-l border-border/50">
                        {settingsMenuItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-4 py-2 transition-all duration-200 hover:bg-sidebar-accent/50 group rounded-md"
                                activeClassName="bg-primary/10 text-primary font-semibold"
                              >
                                <item.icon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                                {open && <span className="text-sm">{item.title}</span>}
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 bg-sidebar-background/50 backdrop-blur-md">
        <div className={cn("flex items-center gap-3 py-4 transition-all duration-300", open ? "px-6" : "px-2 justify-center")}>
          <UserMenu />
          {open && (
            <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-xs font-semibold text-foreground truncate">Usuário</span>
              <span className="text-[10px] text-muted-foreground truncate">Conectado</span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full py-3 border-t border-border/30 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-300 group"
          title={open ? "Minimizar menu" : "Expandir menu"}
        >
          {open ? (
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          ) : (
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
