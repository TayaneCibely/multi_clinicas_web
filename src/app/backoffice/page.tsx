"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Key,
  Loader2,
  Save,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import NoShowMetricCard from "@/components/NoShowMetricCard";
import { useAuthStore } from "@/store/useAuthStore";
import DailyAgendaTimeline from "./_components/DailyAgendaTimeline";
import {
  Agendamento,
  createFallbackAgendamentos,
  filterAgendamentosByDate,
  getAgendaMetrics,
  statusConfig,
} from "./_lib/dashboard";

type AppointmentStatus = "AGENDADO" | "CONFIRMADO" | "REALIZADO" | "FALTOU" | "CANCELADO_CLINICA";

interface DashboardAgendamento extends Agendamento {
  tipoPagamento?: "PARTICULAR" | "CONVENIO";
  nomePlanoSaude?: string | null;
  observacoes?: string | null;
  tokenAutorizacao?: string | null;
}

function normalizeAgendamento(agendamento: DashboardAgendamento): DashboardAgendamento {
  return {
    ...agendamento,
    tipoPagamento: agendamento.tipoPagamento ?? "PARTICULAR",
    nomePlanoSaude: agendamento.nomePlanoSaude ?? null,
    observacoes: agendamento.observacoes ?? null,
    tokenAutorizacao: agendamento.tokenAutorizacao ?? null,
  };
}

function createDashboardFallbackAgendamentos(selectedDate: string): DashboardAgendamento[] {
  return createFallbackAgendamentos(selectedDate).map((agendamento, index) => {
    const isConvenio = index % 2 === 1;

    return {
      ...agendamento,
      tipoPagamento: isConvenio ? "CONVENIO" : "PARTICULAR",
      nomePlanoSaude: isConvenio ? "Vida Plena" : null,
      observacoes: index === 0 ? "Paciente pediu confirmação por mensagem antes da consulta." : null,
      tokenAutorizacao: isConvenio && index === 1 ? "882910" : null,
    };
  });
}

function formatAppointmentDateLabel(date: string) {
  return format(new Date(`${date}T00:00:00`), "dd 'de' MMMM", { locale: ptBR });
}

export default function BackofficeDashboard() {
  const { activeTenant } = useAuthStore();
  const [agendamentos, setAgendamentos] = useState<DashboardAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>("all");
  const [selectedAppt, setSelectedAppt] = useState<DashboardAgendamento | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const selectedDate = useMemo(() => format(currentDate, "yyyy-MM-dd"), [currentDate]);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        setLoading(true);
        const { data } = await api.get<DashboardAgendamento[]>("/agendamentos");
        setAgendamentos(filterAgendamentosByDate(data, selectedDate).map(normalizeAgendamento));
      } catch (error) {
        console.error("Erro ao buscar agendamentos. Usando dados mockados...", error);
        setAgendamentos(createDashboardFallbackAgendamentos(selectedDate));
      } finally {
        setLoading(false);
      }
    };

    void fetchAgendamentos();
  }, [selectedDate]);

  useEffect(() => {
    setSelectedAppt(null);
    setTokenInput("");
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const medicos = useMemo(() => {
    const uniqueMedicos = new Map<number, { id: number; nome: string }>();

    agendamentos.forEach((agendamento) => {
      if (!uniqueMedicos.has(agendamento.medicoId)) {
        uniqueMedicos.set(agendamento.medicoId, {
          id: agendamento.medicoId,
          nome: agendamento.nomeMedico,
        });
      }
    });

    return Array.from(uniqueMedicos.values()).sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));
  }, [agendamentos]);

  useEffect(() => {
    if (selectedMedicoId === "all") {
      return;
    }

    const medicoStillAvailable = medicos.some((medico) => String(medico.id) === selectedMedicoId);

    if (!medicoStillAvailable) {
      setSelectedMedicoId("all");
    }
  }, [medicos, selectedMedicoId]);

  const filteredAgendamentos = useMemo(() => {
    if (selectedMedicoId === "all") {
      return agendamentos;
    }

    return agendamentos.filter((agendamento) => String(agendamento.medicoId) === selectedMedicoId);
  }, [agendamentos, selectedMedicoId]);

  const agendaMetrics = useMemo(() => getAgendaMetrics(filteredAgendamentos), [filteredAgendamentos]);

  const selectedApptStatus = selectedAppt ? statusConfig[selectedAppt.status] ?? statusConfig.AGENDADO : null;

  const handleStatusChange = async (appointmentId: number, nextStatus: AppointmentStatus) => {
    try {
      if (nextStatus === "CANCELADO_CLINICA") {
        await api.patch(`/agendamentos/${appointmentId}/cancelar`, null, {
          params: { canceladoPelaClinica: true },
        });
      } else {
        await api.patch(`/agendamentos/${appointmentId}/status`, { novoStatus: nextStatus });
      }

      setAgendamentos((current) =>
        current.map((agendamento) =>
          agendamento.id === appointmentId
            ? {
              ...agendamento,
              status: nextStatus,
            }
            : agendamento
        )
      );

      setSelectedAppt((current) =>
        current && current.id === appointmentId
          ? {
            ...current,
            status: nextStatus,
          }
          : current
      );
    } catch (error: unknown) {
      console.error("Erro ao atualizar status:", error);

      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? "Não foi possível atualizar o status da consulta. Verifique sua conexão."
        : "Não foi possível atualizar o status da consulta. Verifique sua conexão.";

      alert(errorMessage);
    }
  };

  const openDetails = (agendamento: DashboardAgendamento) => {
    setSelectedAppt(agendamento);
    setTokenInput(agendamento.tokenAutorizacao ?? "");
  };

  const handleSaveToken = async () => {
    if (!selectedAppt) {
      return;
    }

    try {
      setIsSavingToken(true);
      await api.patch(`/agendamentos/${selectedAppt.id}/token`, { tokenAutorizacao: tokenInput.trim() || null });

      setAgendamentos((current) =>
        current.map((agendamento) =>
          agendamento.id === selectedAppt.id
            ? {
              ...agendamento,
              tokenAutorizacao: tokenInput.trim() || null,
            }
            : agendamento
        )
      );

      setSelectedAppt((current) =>
        current
          ? {
            ...current,
            tokenAutorizacao: tokenInput.trim() || null,
          }
          : current
      );

      alert("Token salvo com sucesso!");
    } catch (error: unknown) {
      console.error("Erro ao salvar token de autorização:", error);

      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? "Não foi possível salvar o token de autorização."
        : "Não foi possível salvar o token de autorização.";

      alert(errorMessage);
    } finally {
      setIsSavingToken(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 bg-surface-page">
      <section className="border-b border-border-subtle pb-4">
        <div className="flex flex-col gap-4">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary">Visão Geral</h1>
              <p className="mt-1 text-sm text-text-secondary">{activeTenant?.name || "Clínica"}</p>
            </div>

            <div className="flex items-center gap-2 rounded-panel border border-border-default bg-surface-card p-1 shadow-card">
              <Button variant="ghost" size="icon-sm" className="rounded-button" onClick={() => changeDate(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <div className="min-w-[144px] px-2 text-center">
                <p className="text-sm font-bold capitalize leading-none text-text-primary">
                  {format(currentDate, "EEEE", { locale: ptBR })}
                </p>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
                  {format(currentDate, "dd 'de' MMM", { locale: ptBR })}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" className="rounded-button" onClick={() => changeDate(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </header>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedMedicoId("all")}
              className={[
                "rounded-button border px-4 py-2 text-sm font-medium transition-colors",
                selectedMedicoId === "all"
                  ? "border-accent-primary bg-accent-subtle text-accent-primary shadow-card"
                  : "border-border-default bg-surface-card text-text-secondary hover:border-border-default hover:bg-surface-card hover:text-text-primary",
              ].join(" ")}
            >
              Todos
            </button>

            {medicos.map((medico) => {
              const isActive = String(medico.id) === selectedMedicoId;

              return (
                <button
                  key={medico.id}
                  type="button"
                  onClick={() => setSelectedMedicoId(String(medico.id))}
                  className={[
                    "rounded-button border px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-accent-primary bg-accent-subtle text-accent-primary shadow-card"
                      : "border-border-default bg-surface-card text-text-secondary hover:border-border-default hover:bg-surface-card hover:text-text-primary",
                  ].join(" ")}
                >
                  {medico.nome}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <NoShowMetricCard
        realizadoCount={agendaMetrics.realizadoCount}
        faltouCount={agendaMetrics.faltouCount}
      />

      <DailyAgendaTimeline
        agendamentos={filteredAgendamentos}
        loading={loading}
        onStatusChange={handleStatusChange}
        onAppointmentClick={openDetails}
      />

      <Sheet
        open={selectedAppt !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAppt(null);
            setTokenInput("");
          }
        }}
      >
        <SheetContent
          showCloseButton={false}
          className="overflow-y-auto border-l border-border-subtle bg-surface-card shadow-float sm:max-w-xl lg:max-w-2xl"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_55%),radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_48%)]" />

          <SheetHeader className="relative border-b border-border-subtle pb-5 pr-5 pt-6 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 pr-4">
                {selectedApptStatus ? (
                  <span
                    className={[
                      "inline-flex items-center rounded-button border px-3 py-1 text-xs font-semibold shadow-card backdrop-blur-sm",
                      selectedApptStatus.color,
                    ].join(" ")}
                  >
                    {selectedApptStatus.label}
                  </span>
                ) : null}

                <div>
                  <SheetTitle className="text-2xl font-bold text-text-primary">Detalhes da Consulta</SheetTitle>
                  <SheetDescription>Gerencie o atendimento, a recepção e as autorizações em um único painel.</SheetDescription>
                </div>
              </div>

              <SheetClose className="inline-flex size-10 items-center justify-center rounded-full border border-border-default bg-surface-card text-text-secondary shadow-card transition-colors hover:border-accent-primary/20 hover:text-accent-primary">
                <X className="size-4" />
                <span className="sr-only">Fechar painel</span>
              </SheetClose>
            </div>
          </SheetHeader>

          {selectedAppt ? (
            <div className="space-y-6 px-4 py-6 sm:px-6">
              <section className="overflow-hidden rounded-[24px] border border-accent-primary/10 bg-[linear-gradient(145deg,rgba(124,58,237,0.10),rgba(6,182,212,0.06))] p-5 shadow-card">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <Label className="text-xs font-bold uppercase tracking-[0.16em] text-accent-primary">Paciente em foco</Label>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{selectedAppt.nomePaciente}</p>
                    <p className="mt-1 text-sm text-text-secondary">Consulta vinculada ao fluxo operacional da recepção.</p>
                  </div>

                  <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[260px] lg:grid-cols-1">
                    <div className="inline-flex items-center gap-2 rounded-panel border border-white/70 bg-white/80 px-3 py-2 font-medium text-text-primary shadow-sm backdrop-blur-sm">
                      <CalendarDays className="size-4 text-accent-primary" />
                      {formatAppointmentDateLabel(selectedAppt.dataConsulta)}
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-panel border border-white/70 bg-white/80 px-3 py-2 font-medium text-text-primary shadow-sm backdrop-blur-sm">
                      <Clock3 className="size-4 text-accent-primary" />
                      {selectedAppt.horaInicio.slice(0, 5)} às {selectedAppt.horaFim.slice(0, 5)}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-border-subtle bg-surface-page/70 p-4 shadow-card">
                  <div className="mb-3 inline-flex rounded-full bg-accent-subtle p-2 text-accent-primary">
                    <User className="size-5" />
                  </div>
                  <Label className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Paciente</Label>
                  <p className="mt-1 text-base font-bold text-text-primary">{selectedAppt.nomePaciente}</p>
                </div>

                <div className="rounded-[20px] border border-border-subtle bg-surface-page/70 p-4 shadow-card">
                  <div className="mb-3 inline-flex rounded-full bg-surface-card p-2 text-text-secondary shadow-sm">
                    <Stethoscope className="size-5" />
                  </div>
                  <Label className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Médico</Label>
                  <p className="mt-1 text-base font-semibold text-text-primary">{selectedAppt.nomeMedico}</p>
                </div>

                <div className="rounded-[20px] border border-border-subtle bg-surface-page/70 p-4 shadow-card sm:col-span-2">
                  <div className="mb-3 inline-flex rounded-full bg-surface-card p-2 text-text-secondary shadow-sm">
                    <CreditCard className="size-5" />
                  </div>
                  <Label className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Pagamento</Label>
                  <p className="mt-1 text-base font-medium text-text-primary">
                    {selectedAppt.tipoPagamento === "CONVENIO"
                      ? `Convênio: ${selectedAppt.nomePlanoSaude ?? "Não informado"}`
                      : "Particular"}
                  </p>
                </div>

                {selectedAppt.observacoes ? (
                  <div className="rounded-[20px] border border-border-subtle bg-surface-page/70 p-4 shadow-card sm:col-span-2">
                    <div className="mb-3 inline-flex rounded-full bg-surface-card p-2 text-text-secondary shadow-sm">
                      <FileText className="size-5" />
                    </div>
                    <Label className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Observações do Agendamento</Label>
                    <p className="mt-2 rounded-panel border border-border-subtle bg-surface-card px-4 py-3 text-sm italic leading-6 text-text-secondary">
                      &quot;{selectedAppt.observacoes}&quot;
                    </p>
                  </div>
                ) : null}
              </section>

              {selectedAppt.tipoPagamento === "CONVENIO" ? (
                <section className="rounded-[20px] border border-accent-primary/10 bg-[linear-gradient(180deg,rgba(124,58,237,0.05),rgba(255,255,255,0.9))] p-5 shadow-card">
                  <div className="flex items-center gap-2 text-accent-primary">
                    <Key className="size-4.5" />
                    <h4 className="font-bold">Autorização do Convênio</h4>
                  </div>

                  <p className="mt-1 text-sm text-text-secondary">Registre o código liberado pelo plano para manter o atendimento rastreável.</p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="token-autorizacao" className="text-sm font-medium text-text-primary">
                        Código / Senha de Liberação
                      </Label>
                      <Input
                        id="token-autorizacao"
                        value={tokenInput}
                        onChange={(event) => setTokenInput(event.target.value)}
                        placeholder="Ex: 882910"
                        className="h-11 border-border-default bg-surface-card"
                      />
                    </div>

                    <Button className="h-11 sm:mt-auto" onClick={handleSaveToken} disabled={isSavingToken}>
                      {isSavingToken ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      Salvar token
                    </Button>
                  </div>
                </section>
              ) : null}

              <section className="rounded-[20px] border border-border-subtle bg-surface-page/70 p-5 shadow-card">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <Label className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">Ações de Fluxo</Label>
                    <p className="mt-1 text-sm text-text-secondary">Atualize a situação do atendimento sem sair da agenda.</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <Button
                    size="lg"
                    className="w-full justify-center bg-status-success text-white shadow-card hover:bg-status-success/90"
                    onClick={() => handleStatusChange(selectedAppt.id, "REALIZADO")}
                    disabled={selectedAppt.status === "REALIZADO"}
                  >
                    Confirmar Atendimento
                  </Button>

                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-status-warning bg-white text-status-warning hover:bg-status-warning/10"
                      onClick={() => handleStatusChange(selectedAppt.id, "FALTOU")}
                      disabled={selectedAppt.status === "FALTOU"}
                    >
                      Marcar Falta
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-status-error bg-white text-status-error hover:bg-status-error/10"
                      onClick={() => handleStatusChange(selectedAppt.id, "CANCELADO_CLINICA")}
                      disabled={selectedAppt.status === "CANCELADO_CLINICA"}
                    >
                      Cancelar Horário
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
