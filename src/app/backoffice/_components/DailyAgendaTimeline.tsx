import {
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Info,
  MessageCircleMore,
  Stethoscope,
  UserRound,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Agendamento, statusConfig } from "../_lib/dashboard";

interface DailyAgendaTimelineProps {
  agendamentos: Array<
    Agendamento & {
      tipoPagamento?: "PARTICULAR" | "CONVENIO";
      nomePlanoSaude?: string | null;
      observacoes?: string | null;
      tokenAutorizacao?: string | null;
    }
  >;
  loading: boolean;
  onStatusChange: (
    appointmentId: number,
    nextStatus: "AGENDADO" | "CONFIRMADO" | "REALIZADO" | "FALTOU" | "CANCELADO_CLINICA"
  ) => void | Promise<void>;
  onAppointmentClick: (agendamento: DailyAgendaTimelineProps["agendamentos"][number]) => void;
}

const STATUS_OPTIONS = [
  { value: "AGENDADO", label: "Agendado" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "REALIZADO", label: "Realizado" },
  { value: "FALTOU", label: "Falta" },
  { value: "CANCELADO_CLINICA", label: "Cancelado" },
] as const;

function formatHour(hora: string) {
  return hora.slice(0, 5);
}

function formatModalidade(agendamento: DailyAgendaTimelineProps["agendamentos"][number]) {
  if (agendamento.nomePlanoSaude) {
    return agendamento.nomePlanoSaude;
  }

  return agendamento.tipoPagamento === "CONVENIO" ? "Convênio" : "Particular";
}

function getWhatsAppHref(agendamento: DailyAgendaTimelineProps["agendamentos"][number]) {
  const mensagem = `Olá, ${agendamento.nomePaciente}. Estou entrando em contato sobre sua consulta de ${formatHour(agendamento.horaInicio)} com ${agendamento.nomeMedico}.`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
}

function AgendaLoadingState() {
  return (
    <div className="flex min-h-[360px] flex-1 items-center justify-center rounded-panel border border-border-subtle bg-surface-card shadow-card">
      <div className="h-8 w-8 rounded-full border-4 border-accent-primary border-t-transparent animate-spin" />
    </div>
  );
}

function AgendaEmptyState() {
  return (
    <div className="flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-panel border border-border-subtle bg-surface-card p-8 text-center shadow-card">
      <svg viewBox="0 0 320 220" className="h-48 w-full max-w-[320px] text-text-muted/80" fill="none" aria-hidden>
        <path d="M56 146 132 114 212 138 136 170Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M132 114 132 60 212 84 212 138" stroke="currentColor" strokeWidth="1.5" />
        <path d="M136 170 136 116" stroke="currentColor" strokeWidth="1.5" />
        <path d="M212 138 212 84 258 108 258 162 212 138Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M74 138 148 106 228 130" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
        <path d="M148 106 148 68 228 92" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
        <path d="M162 88 198 98" stroke="currentColor" strokeWidth="1.5" />
        <path d="M162 102 198 112" stroke="currentColor" strokeWidth="1.5" />
        <path d="M162 116 198 126" stroke="currentColor" strokeWidth="1.5" />
        <path d="M82 138 60 150 60 176 84 164 84 144" stroke="currentColor" strokeWidth="1.5" />
        <path d="M60 150 76 154" stroke="currentColor" strokeWidth="1.5" />
        <path d="M54 188 272 188" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
        <circle cx="184" cy="54" r="10" stroke="var(--color-accent-primary)" strokeWidth="1.5" fill="var(--color-accent-subtle)" />
        <path d="M184 36V22" stroke="var(--color-accent-primary)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M176 28H192" stroke="var(--color-accent-primary)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <h2 className="mb-2 text-xl font-bold text-text-primary">Nenhum agendamento para este dia</h2>
      <p className="max-w-md text-text-secondary">
        A agenda está limpa e pronta para ser organizada. Quando houver consultas neste dia, elas aparecerão aqui em ordem cronológica.
      </p>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "REALIZADO") {
    return <CheckCircle2 className="size-3.5" />;
  }

  if (status === "FALTOU" || status === "CANCELADO_CLINICA" || status === "CANCELADO_PACIENTE") {
    return <XCircle className="size-3.5" />;
  }

  return <CircleDashed className="size-3.5" />;
}

export default function DailyAgendaTimeline({
  agendamentos,
  loading,
  onStatusChange,
  onAppointmentClick,
}: DailyAgendaTimelineProps) {
  const orderedAppointments = [...agendamentos].sort((left, right) => left.horaInicio.localeCompare(right.horaInicio));

  return (
    <section className="rounded-panel border border-border-subtle bg-surface-card shadow-card">
      <div className="border-b border-border-subtle px-5 py-4 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Agenda</h2>
          </div>

          <div className="text-right text-sm text-text-secondary">
            {agendamentos.length} {agendamentos.length === 1 ? "consulta" : "consultas"}
          </div>
        </div>
      </div>

      {loading ? (
        <AgendaLoadingState />
      ) : agendamentos.length === 0 ? (
        <AgendaEmptyState />
      ) : (
        <div className="space-y-3 px-4 py-4 md:px-6">
          {orderedAppointments.map((agendamento) => {
            const status = statusConfig[agendamento.status] || statusConfig.AGENDADO;
            const currentStatusValue = agendamento.status === "CANCELADO_PACIENTE" ? "CANCELADO_CLINICA" : agendamento.status;

            return (
              <article
                key={agendamento.id}
                className="grid gap-4 rounded-[20px] border border-border-subtle bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,250,252,0.92))] p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-float md:grid-cols-[112px_minmax(0,1fr)_180px] md:items-start"
              >
                <div className="flex items-start gap-3 md:flex-col md:gap-2">
                  <div className="rounded-[18px] border border-border-subtle bg-surface-page px-4 py-3 shadow-sm md:min-w-[92px] md:pr-6">
                    <p className="text-3xl font-bold tracking-tight text-text-primary">{formatHour(agendamento.horaInicio)}</p>
                    <p className="text-sm text-text-secondary">até {formatHour(agendamento.horaFim)}</p>
                  </div>
                </div>

                <div className="min-w-0">
                  <div
                    className="group min-w-0 cursor-pointer rounded-[18px] border border-transparent px-2 py-1 transition-all hover:border-accent-primary/10 hover:bg-accent-subtle/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20"
                    onClick={() => onAppointmentClick(agendamento)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir detalhes da consulta de ${agendamento.nomePaciente}`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onAppointmentClick(agendamento);
                      }
                    }}
                  >
                      <div className="flex flex-wrap items-center gap-2">
                        <UserRound className="size-4 text-accent-primary" />
                        <h3 className="truncate text-lg font-bold text-text-primary transition-colors group-hover:text-accent-primary">
                          {agendamento.nomePaciente}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-button border border-border-default bg-surface-card px-2 py-1 text-xs font-medium text-text-secondary shadow-sm transition-colors group-hover:border-accent-primary/20 group-hover:text-accent-primary">
                          <Info className="size-3.5" />
                          Detalhes
                        </span>
                        <a
                          href={getWhatsAppHref(agendamento)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-button border border-border-default bg-surface-card text-accent-primary shadow-sm transition-colors hover:bg-accent-subtle"
                          aria-label={`Abrir conversa no WhatsApp para ${agendamento.nomePaciente}`}
                        >
                          <MessageCircleMore className="size-4" />
                        </a>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-2 rounded-button border border-border-default bg-surface-card px-3 py-1.5">
                          <Stethoscope className="size-3.5 text-accent-primary" />
                          {agendamento.nomeMedico}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-button border border-border-default bg-surface-card px-3 py-1.5">
                          <ClipboardCheck className="size-3.5 text-accent-primary" />
                          {formatModalidade(agendamento)}
                        </span>
                      </div>

                      {agendamento.observacoes ? (
                        <p className="mt-3 rounded-panel bg-surface-page px-3 py-2 text-sm text-text-secondary">
                          {agendamento.observacoes}
                        </p>
                      ) : null}
                  </div>
                </div>

                <div className="self-start">
                  <Select
                    value={currentStatusValue}
                    onValueChange={(value) =>
                      onStatusChange(
                        agendamento.id,
                        value as "AGENDADO" | "CONFIRMADO" | "REALIZADO" | "FALTOU" | "CANCELADO_CLINICA"
                      )
                    }
                  >
                    <SelectTrigger
                      onClick={(event) => event.stopPropagation()}
                      className={cn(
                        "h-10 w-full min-w-[156px] rounded-button border px-3 text-sm font-medium shadow-card focus-visible:ring-accent-primary/20",
                        status.color
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <StatusIcon status={currentStatusValue} />
                        <SelectValue placeholder="Status" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-panel border-border-default bg-surface-elevated text-text-primary shadow-float">
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="rounded-panel text-text-primary focus:bg-accent-subtle focus:text-accent-primary"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}