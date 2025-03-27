import React from "react";
import { ContractDoughnutChart } from "@/components/hour-consumption/ContractDoughnutChart";
import { MetricCard } from "@/components/ui/MetricCard";

interface ContractEffortSummaryProps {
  contractData: {
    totalEffort: number;
    demandsCount: number;
    totalHours: number;
  };
}

export function ContractEffortSummary({
  contractData,
}: ContractEffortSummaryProps) {
  return (
    <div className="grid gap-6 grid-cols-1">
      <ContractDoughnutChart
        totalHoursConsumed={contractData.totalEffort}
        hoursRemaining={contractData.totalHours - contractData.totalEffort}
        totalHours={contractData.totalHours}
      />
      <MetricCard
        title="HpD (Horas por Demanda)"
        subtitle="Média de horas consumidas por demanda"
        value={
          contractData.demandsCount > 0
            ? (contractData.totalEffort / contractData.demandsCount).toFixed(2)
            : "0.00"
        }
        unit="horas/demanda"
        color="purple"
        className="h-fit"
      />
    </div>
  );
}
