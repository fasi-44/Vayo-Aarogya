"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore, useAuthStore, useHydration } from "@/store";
import { type UserRole } from "@/types";
import {
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardCheck,
  Activity,
  HandHeart,
  Settings,
  LogOut,
  ChevronLeft,
  HeartPulse,
  Menu,
  X,
  BarChart3,
  Calendar,
} from "lucide-react";

type MenuItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[]; // Roles that can see this menu item
};

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "professional", "volunteer", "family", "elderly"],
  },
  {
    title: "Elderly Records",
    href: "/dashboard/elderly",
    icon: Users,
    roles: ["super_admin", "professional", "volunteer"],
  },
  {
    title: "My Elders",
    href: "/dashboard/my-elders",
    icon: Users,
    roles: ["family"],
  },
  {
    title: "My Assessments",
    href: "/dashboard/my-assessments",
    icon: ClipboardCheck,
    roles: ["elderly"],
  },
  // {
  //   title: 'Assessments',
  //   href: '/dashboard/assessments',
  //   icon: ClipboardCheck,
  //   roles: ['super_admin', 'professional', 'volunteer'],
  // },
  {
    title: "My Interventions",
    href: "/dashboard/my-interventions",
    icon: Activity,
    roles: ["elderly"],
  },
  {
    title: "Interventions",
    href: "/dashboard/interventions",
    icon: Activity,
    roles: ["super_admin", "professional", "volunteer"],
  },
  {
    title: "Volunteers",
    href: "/dashboard/volunteers",
    icon: HandHeart,
    roles: ["super_admin", "professional"],
  },
  {
    title: "My Follow-ups",
    href: "/dashboard/my-followups",
    icon: Calendar,
    roles: ["elderly"],
  },
  {
    title: "Follow-ups",
    href: "/dashboard/followups",
    icon: Calendar,
    roles: ["super_admin", "professional", "volunteer"],
  },
  {
    title: "My Health Report",
    href: "/dashboard/my-report",
    icon: BarChart3,
    roles: ["elderly"],
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["super_admin", "professional"],
  },
  {
    title: "User Management",
    href: "/dashboard/users",
    icon: UserCog,
    roles: ["super_admin", "professional"],
  },
  {
    title: "My Profile",
    href: "/dashboard/profile",
    icon: Settings,
    roles: ["elderly", "family", "volunteer"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    sidebarOpen,
    setSidebarOpen,
  } = useUIStore();
  const { logout, user } = useAuthStore();
  const hydrated = useHydration();

  // Use default values during SSR to prevent hydration mismatch
  const isCollapsed = hydrated ? sidebarCollapsed : false;
  const isOpen = hydrated ? sidebarOpen : false;
  const currentUser = hydrated ? user : null;

  // Filter menu items based on user role
  const filteredMenuItems = useMemo(() => {
    if (!currentUser?.role) return [];
    return menuItems.filter((item) =>
      item.roles.includes(currentUser.role as UserRole)
    );
  }, [currentUser?.role]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-primary flex flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
          "w-[280px]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isOpen && "shadow-2xl lg:shadow-none"
        )}
      >
        {/* Logo Header */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-white/10 px-4",
            isCollapsed ? "lg:justify-center lg:px-0" : "justify-between"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "lg:justify-center"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/10">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div
              className={cn(
                "transition-all duration-200",
                isCollapsed ? "lg:hidden" : "block"
              )}
            >
              <h1 className="text-white font-bold text-lg leading-tight">
                Vayo Aarogya
              </h1>
              <p className="text-white/50 text-[10px] leading-tight">
                Healthy Ageing
              </p>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info - Mobile */}
        <div className={cn("lg:hidden p-4 border-b border-white/10")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
              {currentUser?.name?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {currentUser?.name || "User"}
              </p>
              <p className="text-white/50 text-xs capitalize">
                {currentUser?.role?.replace("_", " ") || "Role"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href + "/"));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                      isCollapsed && "lg:justify-center lg:px-0",
                      isActive
                        ? "bg-white/15 text-white shadow-lg"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                    )}
                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-all",
                        isActive && "text-white"
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium text-sm whitespace-nowrap transition-all duration-200",
                        isCollapsed ? "lg:hidden" : "block"
                      )}
                    >
                      {item.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          {/* Collapse toggle - desktop only */}
          <button
            onClick={toggleSidebarCollapse}
            className={cn(
              "hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "w-5 h-5 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )}
            />
            <span
              className={cn(
                "font-medium text-sm",
                isCollapsed ? "hidden" : "block"
              )}
            >
              Collapse
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-red-300 hover:bg-red-500/10 transition-all",
              isCollapsed && "lg:justify-center lg:px-0"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span
              className={cn(
                "font-medium text-sm",
                isCollapsed ? "lg:hidden" : "block"
              )}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  const { setSidebarOpen } = useUIStore();

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-muted transition-colors"
      aria-label="Open menu"
    >
      <Menu className="w-6 h-6 text-foreground" />
    </button>
  );
}
