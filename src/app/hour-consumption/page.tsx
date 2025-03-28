"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import React from "react";
import {
  HoursBurnupChart,
  ContractEffortSummary,
  LoadingState,
  ErrorState,
  formatDate,
  processWeeklyHoursFromContractData,
  WeeklyHoursData,
  MonthlyHoursChart,
} from "@/components/hour-consumption";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";
import { getContractTotalEffort } from "@/services/contractEffortService";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

export default function HourConsumptionPage() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("contract_id") || "0";
  const isContractIdEmpty = !contractId || contractId === "0";

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [contractData, setContractData] = useState<{
    weeklyHoursData: WeeklyHoursData[];
    currentWeekIndex: number;
    hoursNeeded: number;
    totalContractHours: number;
    contract: {
      start_date: string;
      end_date: string;
      total_hours: number;
    };
    totalEffort: number;
    demandsCount: number;
    finishedDemandsEffort: number;
    product: {
      name: string;
    };
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (isContractIdEmpty) return;

      setIsLoading(true);
      setError(null);

      try {
        const contractEffortData = await getContractTotalEffort(
          Number(contractId)
        );

        const processedData = processWeeklyHoursFromContractData({
          demandEfforts: contractEffortData.demandEfforts,
          projectAdditionalHours: contractEffortData.projectAdditionalHours,
          contract: contractEffortData.contract,
        });

        const contractStartDate = new Date(
          contractEffortData.contract.start_date
        );
        const contractEndDate = new Date(contractEffortData.contract.end_date);

        const filteredDemandEfforts = contractEffortData.demandEfforts.filter(
          (effort) => {
            const effortDate = new Date(effort.start_time_to_computation);
            return (
              effortDate >= contractStartDate && effortDate <= contractEndDate
            );
          }
        );

        const filteredProjectAdditionalHours =
          contractEffortData.projectAdditionalHours.filter((hour) => {
            const hourDate = new Date(hour.event_date);
            return hourDate >= contractStartDate && hourDate <= contractEndDate;
          });

        const filteredEffortTotal = filteredDemandEfforts.reduce(
          (sum, item) => sum + item.effort_value,
          0
        );

        const filteredAdditionalHoursTotal =
          filteredProjectAdditionalHours.reduce(
            (sum, item) => sum + item.hours,
            0
          );

        const totalEffortFromAllSources =
          filteredEffortTotal + filteredAdditionalHoursTotal;

        setContractData({
          ...processedData,
          totalEffort: totalEffortFromAllSources,
          demandsCount: contractEffortData.demandsCount,
          finishedDemandsEffort: contractEffortData.finishedDemandsEffort,
          product: contractEffortData.product,
        });
      } catch (err) {
        console.error("Error fetching contract data:", err);
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred")
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [contractId, isContractIdEmpty]);

  if (isContractIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Consumo de Horas</h1>
        </div>
        <ParameterSelectionButtons parameterName="contract_id" />
      </main>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!contractData) {
    return <ErrorState error={new Error("No contract data available")} />;
  }

  const {
    weeklyHoursData,
    currentWeekIndex,
    hoursNeeded,
    totalContractHours,
    contract,
    totalEffort,
    demandsCount,
    finishedDemandsEffort,
    product,
  } = contractData;

  const productName = product.name;

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Consumo de Horas
          <span className="ml-2 text-blue-600">- {productName}</span>
          <span className="ml-2 text-green-600">- Contrato #{contractId}</span>
        </h1>
      </div>

      <div className="grid gap-6 grid-cols-4 my-8">
        <ContractEffortSummary
          totalEffort={totalEffort}
          demandsCount={demandsCount}
          totalHours={totalContractHours}
          finishedDemandsEffort={finishedDemandsEffort}
        />
        <HoursBurnupChart
          weeklyHoursData={weeklyHoursData}
          currentWeekIndex={currentWeekIndex}
          hoursNeeded={hoursNeeded}
          contractTotalHours={totalContractHours}
          startDate={contract.start_date}
          endDate={contract.end_date}
          formatDate={formatDate}
        />
        <MonthlyHoursChart weeklyHoursData={weeklyHoursData} />
      </div>
    </main>
  );
}
