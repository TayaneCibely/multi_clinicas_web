"use client";

import { motion } from "framer-motion";
import { Dot, TrendingDown, TrendingUp } from "lucide-react";

interface NoShowMetricCardProps {
  realizadoCount: number;
  faltouCount: number;
}

export default function NoShowMetricCard({ realizadoCount, faltouCount }: NoShowMetricCardProps) {
  const concluidoCount = realizadoCount + faltouCount;
  const hasCompletedData = concluidoCount > 0;
  const faltasPercent = concluidoCount > 0 ? Math.round((faltouCount / concluidoCount) * 100) : 0;
  const presencaPercent = concluidoCount > 0 ? 100 - faltasPercent : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-card border border-border-subtle bg-surface-card p-4 shadow-card"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-text-primary">Absenteísmo</h2>
          <p className="mt-1 text-sm text-text-secondary">{concluidoCount} consultas resolvidas</p>
        </div>

        <div className="flex items-start gap-5 self-start md:justify-end">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-text-secondary">
              <TrendingUp className="size-3.5 text-accent-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Presenças</span>
            </div>
            <p className="mt-1 text-2xl font-bold leading-none text-text-primary">{presencaPercent}%</p>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 text-text-secondary">
              <TrendingDown className="size-3.5 text-status-error" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">Faltas</span>
            </div>
            <p className="mt-1 text-2xl font-bold leading-none text-status-error">{faltasPercent}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border-subtle bg-surface-page px-4 py-4 shadow-card">
        <div className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">{realizadoCount}</span>
          <span>realizadas</span>
          <Dot className="size-3.5 text-text-muted" />
          <span className="font-medium text-text-primary">{faltouCount}</span>
          <span>faltas</span>
        </div>

        {!hasCompletedData ? (
          <p className="mt-2 text-sm text-text-muted">Aguardando consultas realizadas ou faltas.</p>
        ) : null}
      </div>
    </motion.section>
  );
}