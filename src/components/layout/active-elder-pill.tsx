"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Users, ArrowRightLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useHydration } from "@/store";
import { getFamilyElders } from "@/services/users";
import { cn, getInitials } from "@/lib/utils";
import type { SafeUser } from "@/types";

// Header pill shown only for family-role users. When no elder is selected it
// invites the user to pick one (links to /dashboard/my-elders). When an elder
// is active, shows their name and offers a quick switcher of linked elders.
export function ActiveElderPill() {
    const router = useRouter();
    const hydrated = useHydration();
    const { user, activeElder, setActiveElder, clearActiveElder } = useAuthStore();
    const [linkedElders, setLinkedElders] = React.useState<SafeUser[]>([]);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        if (!hydrated || user?.role !== "family") return;
        getFamilyElders().then((res) => {
            if (cancelled) return;
            if (res.success && Array.isArray(res.data)) setLinkedElders(res.data);
        });
        return () => { cancelled = true; };
    }, [hydrated, user?.role, activeElder?.id]);

    if (!hydrated || user?.role !== "family") return null;

    const handleSwitch = async (elderId: string) => {
        setOpen(false);
        const ok = await setActiveElder(elderId);
        if (ok) router.push("/dashboard");
    };

    const handleExit = async () => {
        setOpen(false);
        await clearActiveElder();
        router.push("/dashboard/my-elders");
    };

    // Not impersonating — single CTA chip
    if (!activeElder) {
        return (
            <Link
                href="/dashboard/my-elders"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors text-sm font-medium"
            >
                <Users className="w-4 h-4" />
                Select Elder
            </Link>
        );
    }

    // Impersonating — pill + switcher dropdown
    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "flex items-center gap-2 pl-1 pr-2 sm:pr-3 py-1 rounded-full",
                        "border border-amber-300 bg-amber-50 hover:bg-amber-100",
                        "transition-colors text-sm font-medium text-amber-900"
                    )}
                    aria-label="Switch elder"
                >
                    <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-amber-200 text-amber-900 text-[10px]">
                            {getInitials(activeElder.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-[120px] truncate">
                        Viewing as {activeElder.name.split(" ")[0]}
                    </span>
                    <span className="sm:hidden">{activeElder.name.split(" ")[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Currently viewing
                </DropdownMenuLabel>
                <div className="px-2 pb-2 flex items-center gap-2">
                    <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(activeElder.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{activeElder.name}</p>
                        {activeElder.vayoId && (
                            <p className="text-xs font-mono text-muted-foreground truncate">
                                {activeElder.vayoId}
                            </p>
                        )}
                    </div>
                </div>
                <DropdownMenuSeparator />
                {linkedElders.length > 1 && (
                    <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Switch elder
                        </DropdownMenuLabel>
                        {linkedElders
                            .filter((e) => e.id !== activeElder.id)
                            .map((elder) => (
                                <DropdownMenuItem
                                    key={elder.id}
                                    onClick={() => handleSwitch(elder.id)}
                                    className="cursor-pointer flex items-center gap-2"
                                >
                                    <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                            {getInitials(elder.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 truncate">{elder.name}</span>
                                </DropdownMenuItem>
                            ))}
                        <DropdownMenuSeparator />
                    </>
                )}
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/my-elders" className="cursor-pointer flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        All my elders
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExit} className="cursor-pointer flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4" />
                    Stop viewing as {activeElder.name.split(" ")[0]}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
