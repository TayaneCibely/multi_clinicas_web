import api from "@/services/api";

export interface AgendamentoResponseDTO {
  id: number;
  pacienteId: number;
  nomePaciente: string;
  medicoId: number;
  nomeMedico: string;
  dataConsulta: string;
  horaInicio: string;
  horaFim: string;
  status: string;
  tipoPagamento: "PARTICULAR" | "CONVENIO";
  nomePlanoSaude: string | null;
  observacoes: string | null;
}

export async function buscarMinhasConsultas() {
  const response = await api.get<AgendamentoResponseDTO[]>("/agendamentos/me");
  return response.data;
}
