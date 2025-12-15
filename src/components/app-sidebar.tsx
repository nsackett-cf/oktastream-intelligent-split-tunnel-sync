import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, List, Settings, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
const navItems = [
  { href: "/", label: "Mission Control", icon: Home },
  { href: "/explorer", label: "IP Explorer", icon: List },
  { href: "/settings", label: "Configuration", icon: Settings },
];
export function AppSidebar(): JSX.Element {
  const location = useLocation();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-blue-400 dark:bg-slate-800">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">OktaStream</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={location.pathname === item.href}
                className={cn(
                  "justify-start",
                  location.pathname === item.href && "bg-primary/10 text-primary dark:bg-blue-500/10 dark:text-blue-400"
                )}
              >
                <NavLink to={item.href}>
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}