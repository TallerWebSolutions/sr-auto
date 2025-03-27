import React from "react";
import { ContractDoughnutChart } from "@/components/hour-consumption/ContractDoughnutChart";
import { MetricCard } from "@/components/ui/MetricCard";

interface ContractEffortSummaryProps {
  contractData: {
    totalEffort: number;
    demandsCount: number;
    contract: {
      start_date: string;
      end_date: string;
      total_hours: number;
    };
  };
}

export function ContractEffortSummary({
  contractData
}: ContractEffortSummaryProps) {
  return (
    <div className="grid gap-6 grid-cols-1">
      <ContractDoughnutChart
        totalHoursConsumed={contractData.totalEffort}
        hoursRemaining={contractData.contract.total_hours - contractData.totalEffort}
        contractTotalHours={contractData.contract.total_hours}
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
