import { ContractDoughnutChart } from "@/components/hour-consumption/ContractDoughnutChart";
import { MetricCard } from "@/components/ui/MetricCard";
import React from "react";

interface HourConsumptionSummaryProps {
  totalHoursConsumed: number;
  hpd: number;
  contractTotalHours: number;
  contractStartDate?: string;
  contractEndDate?: string;
  formatDate: (dateString: string) => string;
  activeContractsCount: number;
}

export function HourConsumptionSummary({
  totalHoursConsumed,
  hpd,
  contractTotalHours,
  contractStartDate,
  contractEndDate,
  formatDate,
  activeContractsCount,
}: HourConsumptionSummaryProps) {
  const hoursUsedPercentage = (totalHoursConsumed / contractTotalHours) * 100;
  const hoursRemaining = contractTotalHours - totalHoursConsumed;
  
  let contractSubtitle = "Nenhum contrato ativo";
  
  if (activeContractsCount > 1) {
    contractSubtitle = `${activeContractsCount} contratos ativos (soma total)`;
  } else if (contractStartDate && contractEndDate) {
    contractSubtitle = `Contrato ativo: ${formatDate(contractStartDate)} a ${formatDate(contractEndDate)}`;
  }
    
  return (
    <div className="grid gap-6 md:grid-cols-3 mb-6">
      <div className="grid gap-6 md:grid-cols-1 mb-6">
        <MetricCard
          title="Horas Disponíveis no Contrato"
          subtitle={contractSubtitle}
          value={contractTotalHours}
          unit="horas"
          color="green"
        />

        <MetricCard
          title="Consumo Total de Horas"
          subtitle="Todas as demandas do produto (Cliente ID: 285)"
          value={totalHoursConsumed.toFixed(0)}
          unit="horas"
          color="red"
        />
      </div>

      <ContractDoughnutChart
        totalHoursConsumed={totalHoursConsumed}
        hoursRemaining={hoursRemaining}
        contractTotalHours={contractTotalHours}
        hoursUsedPercentage={hoursUsedPercentage}
        activeContractsCount={activeContractsCount}
      />

      <MetricCard
        title="HpD (Horas por Demanda)"
        subtitle="Média de horas consumidas por demanda"
        value={hpd.toFixed(2)}
        unit="horas/demanda"
        color="purple"
        className="h-fit"
      />
    </div>
  );
}
