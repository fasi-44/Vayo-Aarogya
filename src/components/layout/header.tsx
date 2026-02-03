"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, Settings, User, LogOut, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileMenuButton } from "./sidebar";
import { useUIStore, useAuthStore, useHydration } from "@/store";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Role display names
const roleDisplayNames: Record<string, string> = {
    super_admin: "Super Admin",
    professional: "Professional",
    volunteer: "Volunteer",
    family: "Family Member",
    elderly: "Elder",
};

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const router = useRouter();
    const { sidebarCollapsed } = useUIStore();
    const { user, logout } = useAuthStore();
    const hydrated = useHydration();
    const [searchOpen, setSearchOpen] = React.useState(false);

    // Use default value during SSR to prevent hydration mismatch
    const isCollapsed = hydrated ? sidebarCollapsed : false;

    // Get user initials
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const userInitials = hydrated && user?.name ? getInitials(user.name) : "??";
    const userName = hydrated && user?.name ? user.name : "Loading...";
    const userRole = hydrated && user?.role ? roleDisplayNames[user.role] || user.role : "";
    const userEmail = hydrated && user?.email ? user.email : "";

    const handleLogout = async () => {
        await logout();
        router.push("/auth/login");
    };

    return (
        <header className={cn(
            "fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300",
            // Adjust left margin based on sidebar state
            isCollapsed ? "lg:left-[72px]" : "lg:left-64",
            "left-0"
        )}>
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                {/* Left side */}
                <div className="flex items-center gap-3 min-w-0">
                    <MobileMenuButton />
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Search - Desktop */}
                    <div className="hidden md:flex items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="h-9 w-44 lg:w-56 pl-9 pr-9 bg-muted rounded-lg border-0 outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring transition-all"
                            />
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Search - Mobile toggle */}
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Search"
                    >
                        <Search className="w-5 h-5 text-muted-foreground" />
                    </button>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                                <Bell className="w-5 h-5 text-muted-foreground" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                Notifications
                                <span className="text-xs font-normal text-primary cursor-pointer hover:underline">
                                    Mark all as read
                                </span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-y-auto">
                                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                    <div className="flex items-center gap-2 w-full">
                                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                        <span className="font-medium text-sm">New registration</span>
                                        <span className="text-xs text-muted-foreground ml-auto">2m ago</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4">
                                        Dr. Smith registered for the Neurology Conference
                                    </p>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                    <div className="flex items-center gap-2 w-full">
                                        <span className="w-2 h-2 bg-muted rounded-full flex-shrink-0" />
                                        <span className="font-medium text-sm">Payment received</span>
                                        <span className="text-xs text-muted-foreground ml-auto">1h ago</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4">
                                        Payment of $299 received for CME Workshop
                                    </p>
                                </DropdownMenuItem>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="justify-center text-primary text-sm">
                                View all notifications
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Help - desktop only */}
                    <button className="hidden lg:flex p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Help">
                        <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    </button>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-6 bg-border mx-1" />

                    {/* Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-2 rounded-lg hover:bg-muted transition-colors">
                                <Avatar className="w-8 h-8 ring-2 ring-background">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:block text-left max-w-[120px]">
                                    <p className="text-sm font-medium leading-tight truncate">{userName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{userRole}</p>
                                </div>
                                <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>{userName}</span>
                                    <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
                                    <User className="w-4 h-4" />
                                    Profile Settings
                                </Link>
                            </DropdownMenuItem>
                            {user?.role === 'super_admin' && (
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer lg:hidden">
                                <HelpCircle className="w-4 h-4" />
                                Help & Support
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Mobile Search Expanded */}
            {searchOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 p-3 bg-background border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search events, registrations..."
                            autoFocus
                            className="w-full h-10 pl-10 pr-4 bg-muted rounded-lg border-0 outline-none text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                            onBlur={() => setSearchOpen(false)}
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
