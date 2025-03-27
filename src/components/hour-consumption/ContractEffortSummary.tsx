import React from "react";
import { useContractEffort } from "@/hooks/useContractEffort";
import { ContractDoughnutChart } from "@/components/hour-consumption/ContractDoughnutChart";
import { MetricCard } from "@/components/ui/MetricCard";

interface ContractEffortSummaryProps {
  contractId: number | null;
}

export function ContractEffortSummary({
  contractId,
}: ContractEffortSummaryProps) {
  const { data, loading, error } = useContractEffort(contractId);

  if (loading) {
    return (
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">Carregando dados de esforço...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-center">
        <p className="text-red-500">Erro ao carregar dados de esforço</p>
        {error && <p className="text-sm text-gray-500">{error.message}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1">
      <ContractDoughnutChart
        totalHoursConsumed={data.totalEffort}
        hoursRemaining={data.contract.total_hours - data.totalEffort}
        contractTotalHours={data.contract.total_hours}
      />
      <MetricCard
        title="HpD (Horas por Demanda)"
        subtitle="Média de horas consumidas por demanda"
        value={
          data.demandsCount > 0
            ? (data.totalEffort / data.demandsCount).toFixed(2)
            : "0.00"
        }
        unit="horas/demanda"
        color="purple"
        className="h-fit"
      />
    </div>
  );
}
