"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Calendar, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "./ui/button";

export default function DesktopTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, clearAuthData } = useAuthStore();
  const [tenant, setTenant] = useState("Clinica");

  const handleLogout = () => {
    clearAuthData();
    router.push("/login");
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('@multiclinicas:tenantName');
      const hostname = window.location.host; // Usa host para ter a porta e o dominio
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
      let sub = hostname.replace(`.${rootDomain}`, '');

      if (storedName) {
        setTenant(storedName);
      } else if (sub && sub !== hostname) {
        setTenant(sub.replace('-', ' '));
      }
    }
  }, []);

  const navItems = [
    { label: "Início", icon: Home, href: "" },
    { label: "Minhas Consultas", icon: Calendar, href: "/consultas" },
    { label: "Perfil", icon: User, href: "/perfil" },
  ];

  return (
    <header className="bg-surface-card border-b border-border-subtle shadow-sm px-6 h-20 flex items-center justify-between z-50 sticky top-0">
      <div className="flex items-center gap-8">
        {/* Logo/Tenant Name */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white font-bold text-lg">
            {tenant.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-text-primary text-xl capitalize hidden lg:block">
            {tenant}
          </span>
        </Link>

        {/* Navegação Principal */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname.endsWith(item.href) && (item.href !== "" || pathname === '/');
            return (
              <Link
                key={item.label}
                href={item.href === "" ? "/" : item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-panel font-medium transition-colors",
                  isActive
                    ? "bg-accent-subtle text-accent-primary"
                    : "text-text-secondary hover:bg-surface-page hover:text-text-primary"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Área do Usuário */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {user?.role === 'ADMIN' && (
              <Link href="/backoffice" className="hidden lg:block">
                <Button variant="default" className="shadow-btn-glow">Painel de Gestão</Button>
              </Link>
            )}
            {user?.role !== 'ADMIN' && (
              <p>Olá, {user?.name}, sua role é {user?.role}</p>
            )}
            <div onClick={() => router.push("/perfil")} className="flex items-center gap-2 border-l border-border-default pl-4 ml-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-surface-page border border-border-default flex items-center justify-center">
                <User size={16} className="text-text-secondary" />
              </div>
              <span className="text-sm font-bold text-text-primary hidden lg:block">{user?.name}</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={handleLogout} className="text-text-secondary hover:text-status-error" title="Sair">
              <LogOut size={18} />
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="outline">Entrar / Cadastrar</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
