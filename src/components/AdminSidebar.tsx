"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

const navItems = [
    { label: "Clínicas", href: "/admin/clinicas", icon: Building2 },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { clearAuthData } = useAuthStore();

    const handleLogout = () => {
        clearAuthData();
        router.push("/admin-login");
    };

    return (
        <aside className="flex flex-col w-64 min-h-screen bg-surface-page border-r border-border-subtle">
            {/* ── Brand ─────────────────────────────────────────────────────── */}
            <div className="px-6 py-5 border-b border-border-subtle">
                <BrandLogo size={32} />
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest mt-1 ml-11">
                    Portal Master
                </p>
            </div>

            {/* ── Navigation ────────────────────────────────────────────────── */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-panel text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-accent-subtle text-accent-primary"
                                    : "text-text-secondary hover:bg-surface-card hover:text-text-primary"
                            )}
                        >
                            <item.icon className="size-4 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* ── Logout ────────────────────────────────────────────────────── */}
            <div className="px-3 py-4 border-t border-border-subtle">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-panel text-sm font-medium text-text-secondary hover:bg-surface-card hover:text-status-error transition-colors w-full cursor-pointer"
                >
                    <LogOut className="size-4 shrink-0" />
                    Sair
                </button>
            </div>
        </aside>
    );
}
