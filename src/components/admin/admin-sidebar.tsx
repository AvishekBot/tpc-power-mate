import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingCart, Package, Wrench, Users, Wallet, Truck, BarChart3, Zap, LogOut,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, type AppRole } from "@/hooks/use-auth";

type Item = { title: string; url: string; icon: typeof LayoutDashboard; roles?: AppRole[] };

const items: Item[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Sales / POS", url: "/admin/sales", icon: ShoppingCart, roles: ["admin", "manager", "cashier"] },
  { title: "Inventory", url: "/admin/inventory", icon: Package, roles: ["admin", "manager"] },
  { title: "Repair Jobs", url: "/admin/repairs", icon: Wrench, roles: ["admin", "manager", "technician"] },
  { title: "Staff", url: "/admin/staff", icon: Users, roles: ["admin"] },
  { title: "Finance", url: "/admin/finance", icon: Wallet, roles: ["admin", "manager"] },
  { title: "Suppliers", url: "/admin/suppliers", icon: Truck, roles: ["admin", "manager"] },
  { title: "Reports", url: "/admin/reports", icon: BarChart3, roles: ["admin", "manager"] },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, role, signOut, hasRole } = useAuth();

  const isActive = (url: string) => url === "/admin" ? path === "/admin" : path.startsWith(url);

  const visible = items.filter((i) => !i.roles || (role && i.roles.includes(role)));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-bold text-gradient-cyan">TPC Power</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Solutions</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-2 py-1.5 text-xs">
            <div className="font-medium truncate">{user.email}</div>
            <div className="text-muted-foreground capitalize">{role ?? "no role"}</div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
