"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Building2,
    CalendarCheck,
    ShieldCheck,
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

// ─── Topography Texture (SVG ambient) ────────────────────────────────────────

function TopographyTexture() {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 1440 800"
        >
            <path
                d="M0,200 Q360,160 720,200 T1440,200"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-text-primary"
                opacity="0.025"
            />
            <path
                d="M0,300 Q360,260 720,300 T1440,300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-text-primary"
                opacity="0.02"
            />
            <path
                d="M0,400 Q360,370 720,400 T1440,400"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-text-primary"
                opacity="0.025"
            />
            <path
                d="M0,500 Q360,480 720,500 T1440,500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-text-primary"
                opacity="0.02"
            />
        </svg>
    );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
    icon: Icon,
    title,
    description,
    delay,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="bg-surface-card border border-border-subtle rounded-card shadow-card p-6 group hover:shadow-float transition-shadow duration-300"
        >
            <div className="w-10 h-10 rounded-panel bg-accent-subtle flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="size-5 text-accent-primary" />
            </div>
            <h3 className="text-text-primary font-bold text-base mb-2">{title}</h3>
            <p className="text-text-secondary text-sm leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-surface-page relative overflow-hidden">
            <TopographyTexture />

            {/* ── Navbar ──────────────────────────────────────────────────────── */}
            <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
                <BrandLogo />

                <div className="flex items-center gap-3">
                    <Link href="/admin-login">
                        <Button variant="ghost" size="sm">
                            Portal Admin
                        </Button>
                    </Link>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────────────────────── */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-1.5 bg-accent-subtle text-accent-primary text-xs font-semibold px-3 py-1 rounded-full mb-6">
                            <Sparkles className="size-3" />
                            Plataforma Multi-Tenant para Saúde
                        </span>

                        <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight mb-5">
                            Gestão de clínicas{" "}
                            <span className="bg-[image:var(--background-image-accent-gradient)] bg-clip-text text-transparent">
                                sem complexidade.
                            </span>
                        </h1>

                        <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
                            Cada clínica com seu próprio espaço. Agendamentos, pacientes e
                            operação — tudo em uma plataforma centralizada, elegante e pensada
                            para quem cuida de vidas.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-wrap gap-3"
                    >
                        <Link href="/admin/clinicas">
                            <Button className="gap-2 px-6 h-11 text-sm">
                                Começar agora
                                <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                        <Button variant="outline" className="h-11 text-sm px-6">
                            Saiba mais
                        </Button>
                    </motion.div>
                </div>

                {/* ── Hero Visual — Isometric Clinic Building ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="hidden lg:block absolute right-6 top-16 w-[380px]"
                >
                    <svg
                        viewBox="0 0 380 320"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full"
                    >
                        {/* Isometric clinic building */}
                        <path
                            d="M190 40 L300 100 L300 220 L190 280 L80 220 L80 100 Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="none"
                            className="text-border-default"
                            strokeLinejoin="round"
                        />
                        <line x1="190" y1="40" x2="190" y2="280" stroke="currentColor" strokeWidth="0.75" className="text-border-default" strokeDasharray="6 4" />
                        <line x1="80" y1="130" x2="190" y2="190" stroke="currentColor" strokeWidth="0.5" className="text-border-subtle" />
                        <line x1="80" y1="160" x2="190" y2="220" stroke="currentColor" strokeWidth="0.5" className="text-border-subtle" />
                        <line x1="80" y1="190" x2="190" y2="250" stroke="currentColor" strokeWidth="0.5" className="text-border-subtle" />
                        <line x1="300" y1="130" x2="190" y2="190" stroke="currentColor" strokeWidth="0.5" className="text-border-subtle" />
                        <line x1="300" y1="160" x2="190" y2="220" stroke="currentColor" strokeWidth="0.5" className="text-border-subtle" />
                        <line x1="300" y1="190" x2="190" y2="250" stroke="currentColor" strokeWidth="0.5" className="text-border-subtle" />
                        {/* Accent marker */}
                        <circle cx="190" cy="36" r="6" className="fill-accent-primary" />
                        <circle cx="190" cy="36" r="12" className="fill-accent-primary" opacity="0.12" />
                        {/* Medical cross */}
                        <line x1="190" y1="16" x2="190" y2="28" stroke="currentColor" strokeWidth="2" className="text-accent-primary" strokeLinecap="round" />
                        <line x1="184" y1="22" x2="196" y2="22" stroke="currentColor" strokeWidth="2" className="text-accent-primary" strokeLinecap="round" />
                        {/* Tenant connections */}
                        <line x1="40" y1="160" x2="76" y2="160" stroke="currentColor" strokeWidth="1" className="text-accent-primary" strokeDasharray="3 3" opacity="0.4" />
                        <circle cx="36" cy="160" r="4" className="fill-accent-primary" opacity="0.3" />
                        <line x1="40" y1="200" x2="76" y2="200" stroke="currentColor" strokeWidth="1" className="text-accent-primary" strokeDasharray="3 3" opacity="0.3" />
                        <circle cx="36" cy="200" r="3" className="fill-accent-primary" opacity="0.2" />
                        <line x1="304" y1="150" x2="340" y2="150" stroke="currentColor" strokeWidth="1" className="text-accent-primary" strokeDasharray="3 3" opacity="0.4" />
                        <circle cx="344" cy="150" r="4" className="fill-accent-primary" opacity="0.3" />
                        <line x1="304" y1="190" x2="340" y2="190" stroke="currentColor" strokeWidth="1" className="text-accent-primary" strokeDasharray="3 3" opacity="0.3" />
                        <circle cx="344" cy="190" r="3" className="fill-accent-primary" opacity="0.2" />
                    </svg>
                </motion.div>
            </section>

            {/* ── Features ────────────────────────────────────────────────────── */}
            <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <FeatureCard
                        icon={Building2}
                        title="Multi-Tenant Nativo"
                        description="Cada clínica opera em seu próprio subdomínio com dados completamente isolados. Escale de 1 para 100 clínicas sem atrito."
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={CalendarCheck}
                        title="Agendamento Inteligente"
                        description="Pacientes agendam em segundos. Recepcionistas gerenciam com clareza. Sem a complexidade de sistemas tradicionais."
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={ShieldCheck}
                        title="Seguro e Confiável"
                        description="Controle granular de permissões, auditoria de ações e isolamento total de dados entre clínicas."
                        delay={0.3}
                    />
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────────────── */}
            <footer className="relative z-10 border-t border-border-subtle py-8 px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-text-muted">
                        © 2026 MultiClínicas. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-text-muted">Feito com</span>
                        <span className="text-accent-primary text-xs">♥</span>
                        <span className="text-xs text-text-muted">para quem cuida de vidas</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
