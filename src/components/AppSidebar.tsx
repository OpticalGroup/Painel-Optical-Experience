import { LayoutDashboard, Users, Calendar, Settings, FileText, Shield, ScrollText, BookOpen, History, GraduationCap, Palette, Plug, ChevronDown, BookMarked } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "react-router-dom";
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

  // Check if any settings submenu item is active
  const isSettingsActive = settingsMenuItems.some(item => location.pathname === item.url);
  const [settingsOpen, setSettingsOpen] = useState(isSettingsActive);

  // Only admins can see settings menu
  const canAccessSettings = userRole === 'admin';

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent className="pt-8">
        <div className="px-6 pb-6">
          <h2 className="text-xl font-bold text-foreground">
            {open ? "Optical Dental" : "ODA"}
          </h2>
          {open && (
            <p className="text-xs text-muted-foreground mt-1">
              Sistema de Gestão
            </p>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Main menu items */}
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="transition-colors hover:bg-secondary/50"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
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
                        className={`transition-colors hover:bg-secondary/50 ${isSettingsActive ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' : ''
                          }`}
                      >
                        <Settings className="h-4 w-4" />
                        {open && <span>Configurações</span>}
                        {open && (
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {settingsMenuItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                className="transition-colors hover:bg-secondary/50 pl-8"
                                activeClassName="bg-primary/5 text-primary font-medium"
                              >
                                <item.icon className="h-3.5 w-3.5" />
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

      <SidebarFooter className="border-t border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {open && (
            <div className="text-xs text-muted-foreground">
              Usuário conectado
            </div>
          )}
          <UserMenu />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
