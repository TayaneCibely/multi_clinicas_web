"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import NoShowMetricCard from "@/components/NoShowMetricCard";
import { useAuthStore } from "@/store/useAuthStore";
import DailyAgendaTimeline from "./_components/DailyAgendaTimeline";
import {
  Agendamento,
  createFallbackAgendamentos,
  filterAgendamentosByDate,
  getAgendaMetrics,
} from "./_lib/dashboard";

type AppointmentStatus = "AGENDADO" | "CONFIRMADO" | "REALIZADO" | "FALTOU" | "CANCELADO_CLINICA";

interface DashboardAgendamento extends Agendamento {
  tipoPagamento?: "PARTICULAR" | "CONVENIO";
  nomePlanoSaude?: string | null;
  observacoes?: string | null;
}

function normalizeAgendamento(agendamento: DashboardAgendamento): DashboardAgendamento {
  return {
    ...agendamento,
    tipoPagamento: agendamento.tipoPagamento ?? "PARTICULAR",
    nomePlanoSaude: agendamento.nomePlanoSaude ?? null,
    observacoes: agendamento.observacoes ?? null,
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
    };
  });
}

export default function BackofficeDashboard() {
  const { activeTenant } = useAuthStore();
  const [agendamentos, setAgendamentos] = useState<DashboardAgendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMedicoId, setSelectedMedicoId] = useState<string>("all");
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
    } catch (error: unknown) {
      console.error("Erro ao atualizar status:", error);

      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? "Não foi possível atualizar o status da consulta. Verifique sua conexão."
        : "Não foi possível atualizar o status da consulta. Verifique sua conexão.";

      alert(errorMessage);
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
      />
    </div>
  );
}
