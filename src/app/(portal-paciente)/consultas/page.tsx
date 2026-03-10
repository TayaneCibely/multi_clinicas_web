"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { AlertCircle, Calendar, CalendarX, CheckCircle2, Clock, Clock4, FileText, RefreshCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AgendamentoResponseDTO, buscarMinhasConsultas } from "@/services/agendamentoService";
import { statusConfig } from "@/app/backoffice/_lib/dashboard";

function formatarData(dataConsulta: string) {
  const [ano, mes, dia] = dataConsulta.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(ano, mes - 1, dia));
}

function formatarHora(hora: string) {
  return hora.slice(0, 5);
}

function formatarPagamento(consulta: AgendamentoResponseDTO) {
  if (consulta.nomePlanoSaude) {
    return `Convênio: ${consulta.nomePlanoSaude}`;
  }

  return consulta.tipoPagamento === "PARTICULAR" ? "Atendimento particular" : "Atendimento por convênio";
}

function statusIcon(status: string) {
  if (status === "REALIZADO") {
    return <CheckCircle2 size={12} />;
  }

  if (status === "CANCELADO_CLINICA" || status === "CANCELADO_PACIENTE" || status === "FALTOU") {
    return <XCircle size={12} />;
  }

  return <Clock4 size={12} />;
}

function ConsultasLoadingState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-card border border-border-subtle bg-surface-card shadow-card">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-primary border-t-transparent" />
    </div>
  );
}

function ConsultasEmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-card border border-border-subtle bg-surface-card p-8 text-center shadow-card">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-border-subtle bg-surface-page">
        <CalendarX className="text-text-muted" size={32} />
      </div>
      <h2 className="text-lg font-bold text-text-primary">Nenhuma consulta encontrada</h2>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        Assim que houver um agendamento ativo ou histórico registrado, ele aparecerá aqui.
      </p>
    </div>
  );
}

function ConsultasErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-card border border-status-error/20 bg-surface-card p-8 text-center shadow-card">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-status-error/10 text-status-error">
        <AlertCircle size={32} />
      </div>
      <h2 className="text-lg font-bold text-text-primary">Não foi possível carregar suas consultas</h2>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">{error}</p>
      <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
        <RefreshCcw size={16} />
        Tentar novamente
      </Button>
    </div>
  );
}

export default function MinhasConsultasPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [consultas, setConsultas] = useState<AgendamentoResponseDTO[]>([]);
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login`);
    }
  }, [isAuthenticated, isAuthLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    const carregarConsultas = async () => {
      try {
        if (isMounted) {
          setIsLoadingConsultas(true);
          setError(null);
        }

        const data = await buscarMinhasConsultas();

        if (isMounted) {
          setConsultas(data);
        }
      } catch {
        if (isMounted) {
          setError("Confira sua conexão e tente novamente em instantes.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingConsultas(false);
        }
      }
    };

    void carregarConsultas();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, reloadSeed]);

  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen p-6 bg-surface-page pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Minhas Consultas</h1>
        <p className="text-sm text-text-secondary mt-1">Histórico e agendamentos futuros.</p>
      </header>

      <main className="space-y-4">
        {isLoadingConsultas ? (
          <ConsultasLoadingState />
        ) : error ? (
          <ConsultasErrorState error={error} onRetry={() => setReloadSeed((current) => current + 1)} />
        ) : consultas.length === 0 ? (
          <ConsultasEmptyState />
        ) : (
          consultas.map((consulta) => {
            const status = statusConfig[consulta.status] ?? statusConfig.AGENDADO;

            return (
              <div
                key={consulta.id}
                className="bg-surface-card p-5 rounded-card border border-border-subtle shadow-card flex flex-col space-y-3"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-text-primary text-lg">{consulta.nomeMedico}</h3>
                    <p className="text-sm text-text-secondary">{formatarPagamento(consulta)}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border",
                    status.color
                  )}>
                    {statusIcon(consulta.status)}
                    {status.label}
                  </span>
                </div>

                <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-sm text-text-secondary gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-text-muted" />
                    <span>{formatarData(consulta.dataConsulta)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-text-muted" />
                    <span className={cn(consulta.status === "AGENDADO" && "text-accent-primary font-bold")}>
                      {formatarHora(consulta.horaInicio)}
                    </span>
                  </div>
                </div>

                {consulta.observacoes && (
                  <div className="flex items-start gap-2 rounded-panel bg-surface-page px-3 py-2 text-sm text-text-secondary">
                    <FileText size={16} className="mt-0.5 shrink-0 text-text-muted" />
                    <span>{consulta.observacoes}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
