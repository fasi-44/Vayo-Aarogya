"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store";
import type { SafeUser } from "@/types";

interface ElderSwitchPromptProps {
    open: boolean;
    elderId: string | null;
    onCancel?: () => void;
    // Where to navigate after a successful switch. Defaults to current pathname.
    redirectTo?: string;
    // Where to navigate on cancel. Defaults to /dashboard/my-elders.
    cancelTo?: string;
}

// Modal shown when a family user follows a deep link belonging to an elder
// other than the one they're currently impersonating. Per spec we refuse and
// prompt: "Switch to viewing as them?" — accept switches active elder and
// reloads the page; cancel sends them back to the elders list.
export function ElderSwitchPrompt({
    open,
    elderId,
    onCancel,
    redirectTo,
    cancelTo = "/dashboard/my-elders",
}: ElderSwitchPromptProps) {
    const router = useRouter();
    const { setActiveElder } = useAuthStore();
    const [elder, setElder] = React.useState<SafeUser | null>(null);
    const [switching, setSwitching] = React.useState(false);

    React.useEffect(() => {
        if (!open || !elderId) return;
        let cancelled = false;
        fetch(`/api/users/${elderId}`)
            .then((r) => r.json())
            .then((res) => {
                if (cancelled) return;
                if (res.success && res.data) setElder(res.data);
            })
            .catch(() => { /* show generic copy below */ });
        return () => { cancelled = true; };
    }, [open, elderId]);

    const handleSwitch = async () => {
        if (!elderId) return;
        setSwitching(true);
        const ok = await setActiveElder(elderId);
        setSwitching(false);
        if (ok) {
            // Force a reload so the page re-fetches with the new active-elder cookie.
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
        }
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        else router.push(cancelTo);
    };

    const elderName = elder?.name ?? "another elder";

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-primary" />
                        Switch to {elderName}?
                    </DialogTitle>
                    <DialogDescription>
                        This record belongs to <strong>{elderName}</strong>, but you&apos;re
                        currently viewing as a different elder. Switch the active elder to
                        open it.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancel} disabled={switching}>
                        Cancel
                    </Button>
                    <Button onClick={handleSwitch} disabled={switching || !elderId}>
                        {switching ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Switching…
                            </>
                        ) : (
                            <>Switch to {elder?.name?.split(" ")[0] ?? "elder"}</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper to detect the 409 elder-switch response shape from any of our APIs.
export function getElderSwitchRequired(
    res: { success?: boolean; data?: unknown } | null | undefined
): string | null {
    if (!res || res.success) return null;
    const data = res.data as { requiresElderSwitch?: boolean; elderId?: string } | undefined;
    if (data?.requiresElderSwitch && typeof data.elderId === "string") {
        return data.elderId;
    }
    return null;
}
