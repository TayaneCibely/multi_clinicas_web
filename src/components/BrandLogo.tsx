"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
    className?: string;
    withText?: boolean;
    size?: number;
}

export function BrandLogo({ className, withText = true, size = 40 }: BrandLogoProps) {
    return (
        <Link href="/" className={cn("flex items-center gap-3 group", className)}>
            <div className="relative transition-transform group-hover:scale-105">
                <Image
                    src="/logo.png"
                    alt="MultiClínicas Logo"
                    width={size}
                    height={size}
                    priority
                />
            </div>

            {withText && (
                <span className="text-text-primary font-bold text-xl tracking-tight">
                    Multi<span className="text-accent-primary">Clínicas</span>
                </span>
            )}
        </Link>
    );
}