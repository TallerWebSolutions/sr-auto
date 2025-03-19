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
}

export function HourConsumptionSummary({
  totalHoursConsumed,
  hpd,
  contractTotalHours,
  contractStartDate,
  contractEndDate,
  formatDate,
}: HourConsumptionSummaryProps) {
  const hoursUsedPercentage = (totalHoursConsumed / contractTotalHours) * 100;
  const hoursRemaining = contractTotalHours - totalHoursConsumed;
  
  const contractDateRange = contractStartDate && contractEndDate
    ? formatDate(contractStartDate) + " a " + formatDate(contractEndDate)
    : "Nenhum";
    
  return (
    <div className="grid gap-6 md:grid-cols-3 mb-6">
      <div className="grid gap-6 md:grid-cols-1 mb-6">
        <MetricCard
          title="Horas Disponíveis no Contrato"
          subtitle={`Contrato ativo: ${contractDateRange}`}
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
