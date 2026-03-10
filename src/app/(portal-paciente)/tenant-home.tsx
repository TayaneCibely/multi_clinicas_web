"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  HeartPulse,
  Loader2,
  Pill,
  Plus,
  RotateCw,
  Search,
  UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/services/api";

interface Medico {
  id: number;
  nome: string;
  especialidades: string[];
}

function PulseTexture() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.svg
        viewBox="0 0 800 260"
        className="absolute inset-y-0 left-0 h-full w-[140%] text-text-primary/10"
        animate={{ x: ["0%", "-8%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        fill="none"
      >
        <path
          d="M-40 140 C 20 110, 80 110, 140 140 S 260 170, 320 140 S 440 110, 500 140 S 620 170, 680 140 S 800 110, 860 140"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M-20 176 C 50 150, 115 150, 180 176 S 310 202, 380 176 S 510 150, 580 176 S 710 202, 780 176 S 910 150, 980 176"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="8 12"
        />
        <path
          d="M60 112 L118 112 L138 82 L162 152 L184 124 L246 124"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </div>
  );
}

function MedicoOrbitAvatar({ nome }: { nome: string }) {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center shrink-0">
      <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full text-text-muted/40">
        <circle cx="40" cy="40" r="26" stroke="currentColor" strokeWidth="1" strokeDasharray="3 9" fill="none" />
        <circle cx="40" cy="40" r="35" stroke="currentColor" strokeWidth="1" strokeDasharray="4 12" fill="none" />
      </svg>

      <motion.div
        className="absolute inset-0 text-accent-primary/70"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <Plus className="absolute left-1/2 top-1 h-3.5 w-3.5 -translate-x-1/2" />
        <Pill className="absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
        <HeartPulse className="absolute bottom-1 left-3 h-3.5 w-3.5" />
      </motion.div>

      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border-default bg-accent-subtle text-accent-primary shadow-card">
        <span className="text-base font-bold leading-none">{nome.charAt(0).toUpperCase()}</span>
      </div>
    </div>
  );
}

function MedicosLoadingState() {
  return Array.from({ length: 6 }).map((_, index) => (
    <div
      key={index}
      className="flex flex-col justify-between rounded-card border border-border-subtle bg-surface-card p-4 sm:p-5 shadow-card"
    >
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 animate-pulse rounded-full border border-border-subtle bg-surface-page" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-surface-page" />
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface-page" />
          <div className="flex gap-2 flex-wrap">
            <div className="h-7 w-24 animate-pulse rounded-full bg-surface-page" />
            <div className="h-7 w-20 animate-pulse rounded-full bg-surface-page" />
          </div>
        </div>
      </div>
      <div className="mt-5 h-10 w-full animate-pulse rounded-full bg-surface-page" />
    </div>
  ));
}

export default function TenantHomePage() {
  const [tenant, setTenant] = useState("Clinica");
  const [busca, setBusca] = useState("");
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [especialidadeAtiva, setEspecialidadeAtiva] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('@multiclinicas:tenantName');
      const hostname = window.location.host;
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

      let sub = hostname.replace(`.${rootDomain}`, '');

      if (storedName) {
        setTenant(storedName);
      } else if (sub && sub !== hostname) {
        setTenant(sub.replace("-", " "));
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchMedicos = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
        }

        const response = await api.get<Medico[]>("/medicos/ativos");

        if (isMounted) {
          setMedicos(response.data);
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar os médicos no momento. Tente novamente em instantes.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchMedicos();

    return () => {
      isMounted = false;
    };
  }, [reloadSeed]);

  const especialidadesDisponiveis = useMemo(() => {
    return Array.from(
      new Set(medicos.flatMap((medico) => medico.especialidades.map((especialidade) => especialidade.trim())))
    )
      .filter(Boolean)
      .slice(0, 6);
  }, [medicos]);

  const medicosFiltrados = useMemo(() => {
    const term = busca.trim().toLowerCase();

    return medicos.filter((medico) => {
      const correspondeBusca =
        !term ||
        medico.nome.toLowerCase().includes(term) ||
        medico.especialidades.some((especialidade) => especialidade.toLowerCase().includes(term));

      const correspondeEspecialidade =
        !especialidadeAtiva || medico.especialidades.some((especialidade) => especialidade === especialidadeAtiva);

      return correspondeBusca && correspondeEspecialidade;
    });
  }, [busca, especialidadeAtiva, medicos]);

  const handleRetry = () => {
    setReloadSeed((current) => current + 1);
  };

  return (
    <div className="flex min-h-full flex-col bg-surface-page">
      <header className="relative overflow-hidden border-b border-border-subtle bg-surface-card">
        <PulseTexture />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8 md:py-12">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-[image:var(--background-image-accent-gradient)] text-xl font-bold text-white shadow-float md:h-20 md:w-20 md:text-3xl lg:rounded-2xl">
              {tenant.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary md:text-base">Atendimento em {tenant}</p>
              <h1 className="text-2xl font-bold leading-tight text-text-primary md:text-4xl">
                Escolha seu médico
              </h1>
              <p className="mt-1 text-sm text-text-secondary md:max-w-md md:text-base">
                Encontre o profissional ideal e siga direto para os horários disponíveis.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-card border border-border-subtle bg-surface-elevated p-4 shadow-card md:w-72 md:p-5">
            <div className="flex items-start justify-between gap-4 md:flex-col md:items-start md:gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-accent-primary">
                  Próximo passo
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Filtre por nome ou especialidade e abra a agenda do profissional.
                </p>
              </div>
              <span className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-bold text-accent-primary">
                {isLoading ? "Carregando" : `${medicosFiltrados.length} opções`}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:gap-8">
          <section className="rounded-card border border-border-subtle bg-surface-card p-4 shadow-card md:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted md:left-4 md:h-5 md:w-5" size={18} />
              <Input
                placeholder="Buscar por médico ou especialidade..."
                className="h-12 rounded-panel border-border-default bg-surface-card pl-10 text-text-primary shadow-none md:h-14 md:pl-12 md:text-lg"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>

            {especialidadesDisponiveis.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {especialidadesDisponiveis.map((especialidade) => {
                  const isActive = especialidadeAtiva === especialidade;

                  return (
                    <Button
                      key={especialidade}
                      type="button"
                      variant={isActive ? "secondary" : "outline"}
                      size="sm"
                      className="shrink-0 rounded-full"
                      onClick={() =>
                        setEspecialidadeAtiva((current) =>
                          current === especialidade ? null : especialidade
                        )
                      }
                    >
                      {especialidade}
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <p className="text-text-secondary">
                {isLoading
                  ? "Preparando o catálogo da clínica..."
                  : `${medicosFiltrados.length} profissionais encontrados`}
              </p>

              {(busca || especialidadeAtiva) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-accent-primary"
                  onClick={() => {
                    setBusca("");
                    setEspecialidadeAtiva(null);
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          </section>

          <motion.div layout className="min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <MedicosLoadingState />
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-card border border-border-subtle bg-surface-card p-6 text-center shadow-card"
                >
                  <div className="mx-auto flex w-full max-w-md flex-col text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle text-accent-primary">
                      <RotateCw className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-text-primary">Catálogo indisponível</h2>
                    <p className="mt-2 text-sm text-text-secondary">{error}</p>
                    <Button type="button" className="mx-auto mt-5 w-fit" onClick={handleRetry}>
                      Tentar novamente
                    </Button>
                  </div>
                </motion.div>
              ) : medicosFiltrados.length > 0 ? (
                <motion.div
                  key="list"
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {medicosFiltrados.map((medico) => (
                    <motion.article
                      key={medico.id}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col justify-between rounded-card border border-border-subtle bg-surface-card p-4 shadow-card sm:p-5"
                    >
                      <div>
                        <div className="flex items-start gap-4">
                          <MedicoOrbitAvatar nome={medico.nome} />

                          <div className="min-w-0 flex-1 pt-1">
                            <h3 className="line-clamp-2 text-lg font-bold leading-tight text-text-primary sm:text-xl">
                              {medico.nome}
                            </h3>
                            <p className="mt-1 text-sm text-text-secondary">
                              {medico.especialidades[0] ?? "Especialidade não informada"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {medico.especialidades.slice(0, 3).map((especialidade) => (
                                <span
                                  key={especialidade}
                                  className="rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent-primary"
                                >
                                  {especialidade}
                                </span>
                              ))}

                              {medico.especialidades.length === 0 && (
                                <span className="rounded-full bg-surface-page px-3 py-1 text-xs font-medium text-text-secondary">
                                  Sem especialidade vinculada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button asChild variant="outline" className="mt-5 w-full justify-between rounded-full">
                        <Link href="/agendamento">
                          Ver agenda
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.article>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-card border border-border-subtle bg-surface-card p-6 shadow-card"
                >
                  <div className="mx-auto flex w-full max-w-[220px] justify-center text-text-muted/70">
                    <svg viewBox="0 0 220 140" className="h-auto w-full" fill="none">
                      <path
                        d="M24 96 L74 66 L132 80 L82 110 Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M82 110 L132 80 L188 96 L138 126 Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path d="M76 76 L134 90" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
                      <circle cx="144" cy="74" r="6" className="fill-accent-primary stroke-accent-primary" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div className="mx-auto mt-4 max-w-md text-center">
                    <h2 className="text-lg font-bold text-text-primary md:text-xl">Nenhum profissional encontrado</h2>
                    <p className="mt-2 text-sm text-text-secondary md:text-base">
                      Ajuste a busca ou remova o filtro de especialidade para ampliar os resultados.
                    </p>
                  </div>

                  <div className="mt-5 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setBusca("");
                        setEspecialidadeAtiva(null);
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
