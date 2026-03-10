"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ArrowLeft, UserRound, Stethoscope, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import api from "@/services/api";

interface Especialidade { id: number; nome: string; }
interface Medico { id: number; nome: string; especialidades: string[]; }
interface Horario { time: string; period: "manha" | "tarde"; available: boolean; }

function SolarArc({ horarios, selectedTime, onSelect }: { horarios: Horario[], selectedTime: string | null, onSelect: (t: string) => void }) {
  const manha = horarios.filter(h => h.period === 'manha');
  const tarde = horarios.filter(h => h.period === 'tarde');

  return (
    <div className="space-y-8 py-4">
      <div className="relative w-full h-24 flex items-center justify-center">
        <svg viewBox="0 0 200 100" className="w-48 h-24 text-border-subtle">
          <path d="M 20 80 A 80 80 0 0 1 180 80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
          <motion.circle cx={selectedTime ? "100" : "20"} cy={selectedTime ? "20" : "80"} r="6" fill="var(--color-accent-primary)" animate={{ cx: selectedTime ? 100 : 20, cy: selectedTime ? 20 : 80 }} />
        </svg>
        <div className="absolute bottom-0 text-center">
          <span className="text-2xl font-bold text-text-primary">{selectedTime || "--:--"}</span>
        </div>
      </div>

      {manha.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-text-secondary flex items-center gap-2"><Clock size={14} /> Manhã</h3>
          <div className="grid grid-cols-4 gap-2">
            {manha.map(h => (
              <button key={h.time} disabled={!h.available} onClick={() => onSelect(h.time)} className={cn("py-2 rounded-panel border text-sm font-medium transition-all", !h.available && "bg-surface-page text-text-muted border-transparent cursor-not-allowed opacity-50", h.available && selectedTime === h.time && "bg-accent-primary text-white border-accent-primary shadow-md", h.available && selectedTime !== h.time && "bg-surface-card text-text-primary border-border-default hover:border-accent-primary")}>
                {h.time}
              </button>
            ))}
          </div>
        </div>
      )}

      {tarde.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-text-secondary flex items-center gap-2"><Clock size={14} /> Tarde</h3>
          <div className="grid grid-cols-4 gap-2">
            {tarde.map(h => (
              <button key={h.time} disabled={!h.available} onClick={() => onSelect(h.time)} className={cn("py-2 rounded-panel border text-sm font-medium transition-all", !h.available && "bg-surface-page text-text-muted border-transparent cursor-not-allowed opacity-50", h.available && selectedTime === h.time && "bg-accent-primary text-white border-accent-primary shadow-md", h.available && selectedTime !== h.time && "bg-surface-card text-text-primary border-border-default hover:border-accent-primary")}>
                {h.time}
              </button>
            ))}
          </div>
        </div>
      )}

      {horarios.length === 0 && <div className="text-center py-4 text-text-muted">Nenhum horário disponível para esta data.</div>}
    </div>
  );
}

function AgendamentoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedEsp, setSelectedEsp] = useState<Especialidade | null>(null);
  const [selectedMed, setSelectedMed] = useState<Medico | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoadingDados, setIsLoadingDados] = useState(true);

  const [availableHorarios, setAvailableHorarios] = useState<Horario[]>([]);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);

  const paramMedicoId = searchParams.get("medicoId");
  const paramEspecialidade = searchParams.get("especialidade");

  useEffect(() => {
    const fetchDadosIniciais = async () => {
      try {
        const [resEsp, resMed] = await Promise.all([
          api.get("/especialidades"),
          api.get("/medicos/ativos")
        ]);
        const especialidadesData = resEsp.data;
        const medicosData = resMed.data;

        setEspecialidades(especialidadesData);
        setMedicos(medicosData);

        if (paramMedicoId && paramEspecialidade) {
          const medicoEncontrado = medicosData.find((medico: Medico) => medico.id === Number(paramMedicoId));
          const especialidadeEncontrada = especialidadesData.find(
            (especialidade: Especialidade) => especialidade.nome === paramEspecialidade
          );

          if (medicoEncontrado && especialidadeEncontrada) {
            setSelectedEsp(especialidadeEncontrada);
            setSelectedMed(medicoEncontrado);
            setStep(2);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados iniciais", error);
      } finally {
        setIsLoadingDados(false);
      }
    };
    fetchDadosIniciais();
  }, [paramEspecialidade, paramMedicoId]);

  const medicosFiltrados = useMemo(() => {
    if (!selectedEsp) return [];
    return medicos.filter(m => m.especialidades.includes(selectedEsp.nome));
  }, [selectedEsp, medicos]);

  useEffect(() => {
    if (!selectedMed || !selectedDate) return;

    const loadDisponibilidade = async () => {
      setIsLoadingHorarios(true);
      setSelectedTime(null);
      
      try {
        const response = await api.get("/agendamento/disponibilidade", {
            params: { medicoId: selectedMed.id, data: selectedDate}
        });

        const availabreTimes: string[] = response.data;

        const horariosProcessados: Horario[] = availabreTimes.map(time => {
          const hour = parseInt(time.split(":")[0]);
          return {
            time,
            period: hour < 12 ? "manha" : "tarde",
            available: true
          };
        });

        setAvailableHorarios(horariosProcessados);
      } catch (error) {
        console.error("Erro ao buscar horários", error);
        setAvailableHorarios([]);
      } finally {
        setIsLoadingHorarios(false);
      }
    };

    loadDisponibilidade();
  }, [selectedMed, selectedDate]);

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      const payload = {
        medicoId: selectedMed?.id,
        especialidadeId: selectedEsp?.id,
        data: selectedDate,
        hora: selectedTime
      };
      console.log("Enviando agendamento:", payload);
      await new Promise(r => setTimeout(r, 1500));
      
      setIsFinishing(false);
      setIsSuccess(true);
    } catch(err) {
      console.error(err);
      setIsFinishing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-status-success/10 text-status-success rounded-full flex items-center justify-center">
          <CheckCircle2 size={48} />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Agendamento Realizado!</h1>
          <p className="text-text-secondary mt-2">Sua consulta com {selectedMed?.nome} foi confirmada para o dia {selectedDate} às {selectedTime}.</p>
        </div>
        <Button onClick={() => router.push('/')} className="w-full max-w-xs h-12">
          Voltar ao Início
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[85vh] p-6 bg-surface-page max-w-2xl mx-auto w-full">
      <header className="flex items-center gap-4 mb-8 mt-4">
        <Button variant="ghost" size="icon-sm" onClick={() => step > 1 ? setStep(step - 1) : router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Agendar Consulta</h1>
          <p className="text-sm text-text-secondary">Passo {step} de 2: {step === 1 ? 'Escolha o profissional' : 'Data e Horário'}</p>
        </div>
      </header>

      {isLoadingDados ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {!selectedEsp ? (
                <div className="grid grid-cols-1 gap-3">
                  <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2"><Stethoscope className="text-accent-primary" size={20} /> Qual a especialidade?</h2>
                  {especialidades.map(e => (
                    <button key={e.id} onClick={() => setSelectedEsp(e)} className="flex items-center justify-between p-4 bg-surface-card border border-border-subtle rounded-panel hover:border-accent-primary transition-all text-left">
                      <span className="font-semibold text-text-primary">{e.nome}</span>
                      <ChevronRight size={18} className="text-text-muted" />
                    </button>
                  ))}
                  {especialidades.length === 0 && <p className="text-text-muted text-center py-4">Nenhuma especialidade cadastrada.</p>}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-accent-subtle p-4 rounded-panel flex justify-between items-center border border-accent-primary/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-secondary">Especialidade</p>
                      <p className="font-bold text-accent-primary">{selectedEsp.nome}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEsp(null)}>Alterar</Button>
                  </div>
                  <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2"><UserRound className="text-accent-primary" size={20} /> Selecione o Médico</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {medicosFiltrados.map(m => (
                      <button key={m.id} onClick={() => { setSelectedMed(m); setStep(2); }} className="flex items-center gap-4 p-4 bg-surface-card border border-border-subtle rounded-panel hover:border-accent-primary transition-all text-left">
                        <div className="w-12 h-12 rounded-full bg-surface-page flex items-center justify-center"><UserRound size={24} className="text-text-muted" /></div>
                        <div className="flex-1"><span className="font-bold text-text-primary block">{m.nome}</span><span className="text-xs text-text-secondary">Próximos horários disponíveis</span></div>
                        <ChevronRight size={18} className="text-text-muted" />
                      </button>
                    ))}
                    {medicosFiltrados.length === 0 && <p className="text-text-muted text-center py-4">Nenhum médico encontrado para esta especialidade.</p>}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
              <div className="bg-surface-card p-4 rounded-panel border border-border-subtle shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent-subtle flex items-center justify-center text-accent-primary"><UserRound size={24}/></div>
                <div>
                  <p className="font-bold text-text-primary">{selectedMed?.nome}</p>
                  <p className="text-xs text-text-secondary">{selectedEsp?.nome}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><CalendarIcon className="text-accent-primary" size={20} /> Escolha a Data</h2>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="h-12 bg-surface-card" />
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2"><Clock className="text-accent-primary" size={20} /> Horários Disponíveis</h2>
                {isLoadingHorarios ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <SolarArc horarios={availableHorarios} selectedTime={selectedTime} onSelect={setSelectedTime} />
                )}
              </div>

              <Button 
                onClick={handleFinish} 
                disabled={!selectedTime || isFinishing} 
                className="w-full h-14 text-lg font-bold bg-accent-gradient mt-8 text-white border-0 hover:opacity-90 transition-opacity"
              >
                {isFinishing ? "Finalizando..." : "Confirmar Agendamento"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

export default function AgendamentoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-[85vh] p-6 bg-surface-page max-w-2xl mx-auto w-full items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AgendamentoContent />
    </Suspense>
  );
}