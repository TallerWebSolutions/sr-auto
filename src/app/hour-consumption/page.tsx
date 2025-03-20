"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
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
  HourConsumptionSummary,
  MonthlyHoursBarChart,
  HoursBurnupChart,
  LoadingState,
  ErrorState,
  EmptyState,
  formatDate,
  processDemandsData,
  getActiveContract,
  getTotalHoursFromAllContracts,
  processWeeklyHoursData,
  getCurrentWeekIndex,
  calculateHoursNeeded,
  prepareMonthlyChartData,
} from "@/components/hour-consumption";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";

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

interface DemandsResponse {
  demands: {
    id: string;
    slug: string;
    demand_title: string;
    commitment_date: string | null;
    discarded_at: string | null;
    end_date: string | null;
    effort_upstream: number | null;
    effort_downstream: number | null;
    contract_id: number | null;
  }[];
  customers_by_pk?: {
    name: string;
  };
}

interface ContractsResponse {
  contracts: {
    id: number;
    start_date: string;
    total_hours: number;
    end_date: string;
  }[];
}

const buildCustomerDemandsQuery = (
  customerId: string | null,
  contractId: string | null
) => {
  const filterConditions = `{customer_id: {_eq: ${customerId}}${
    contractId && contractId !== "0"
      ? `, contract_id: {_eq: ${contractId}}`
      : ""
  }}`;

  return gql`
    query CustomerDemandsQuery {
      demands(where: ${filterConditions}) {
        id
        slug
        demand_title
        commitment_date
        discarded_at
        end_date
        effort_upstream
        effort_downstream
        contract_id
      }
      customers_by_pk(
        id: ${customerId}
      ) {
        name
      }
    }
  `;
};

const buildContractsQuery = (customerId: string | null) => gql`
  query ContractsQuery {
    contracts(where: {customer_id: {_eq: ${customerId}}}) {
      id
      start_date
      total_hours
      end_date
    }
  }
`;

const findEarliestStartDate = (
  contractsData: ContractsResponse | undefined
) => {
  if (!contractsData?.contracts || contractsData.contracts.length === 0) {
    return undefined;
  }

  return contractsData.contracts
    .reduce((earliest, contract) => {
      const contractStart = new Date(contract.start_date);
      return contractStart < earliest ? contractStart : earliest;
    }, new Date(contractsData.contracts[0].start_date))
    .toISOString()
    .split("T")[0];
};

const findLatestEndDate = (contractsData: ContractsResponse | undefined) => {
  if (!contractsData?.contracts || contractsData.contracts.length === 0) {
    return undefined;
  }

  let latestDate = new Date(contractsData.contracts[0].end_date);
  let latestEndDate = contractsData.contracts[0].end_date;

  for (const contract of contractsData.contracts) {
    const currentEndDate = new Date(contract.end_date);
    if (currentEndDate > latestDate) {
      latestDate = currentEndDate;
      latestEndDate = contract.end_date;
    }
  }

  return latestEndDate;
};

export default function HourConsumptionPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer_id") || "0";
  const contractId = searchParams.get("contract_id") || "0";
  const isCustomerIdEmpty = !customerId || customerId === "0";

  const {
    loading: demandsLoading,
    error: demandsError,
    data: demandsData,
  } = useQuery<DemandsResponse>(
    buildCustomerDemandsQuery(customerId, contractId),
    {
      fetchPolicy: "network-only",
      skip: isCustomerIdEmpty,
    }
  );

  const {
    loading: contractsLoading,
    error: contractsError,
    data: contractsData,
  } = useQuery<ContractsResponse>(buildContractsQuery(customerId), {
    fetchPolicy: "network-only",
    skip: isCustomerIdEmpty,
  });

  const isLoading = demandsLoading || contractsLoading;
  const hasError = demandsError || contractsError;

  if (isCustomerIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Consumo de Horas</h1>
        </div>
        <ParameterSelectionButtons parameterName="customer_id" />
      </main>
    );
  }

  const { allCustomerDemands, completedDemands, totalHoursConsumed, hpd } =
    processDemandsData(demandsData);

  const selectedContract =
    contractId && contractId !== "0"
      ? contractsData?.contracts.find(
          (contract) => contract.id.toString() === contractId
        )
      : getActiveContract(contractsData);

  const totalContractHours =
    contractId && contractId !== "0"
      ? selectedContract?.total_hours || 0
      : getTotalHoursFromAllContracts(contractsData);

  const currentDate = new Date();
  const activeContracts =
    contractsData?.contracts.filter((contract) => {
      const startDate = new Date(contract.start_date);
      const endDate = new Date(contract.end_date);
      return startDate <= currentDate && endDate >= currentDate;
    }) || [];
  const activeContractsCount = activeContracts.length;

  const globalStartDate = findEarliestStartDate(contractsData);
  const globalEndDate = findLatestEndDate(contractsData);

  const dateRangeForProcessing = selectedContract
    ? selectedContract
    : {
        start_date: globalStartDate || "",
        end_date: globalEndDate || "",
      };

  const weeklyHoursData = processWeeklyHoursData(
    demandsData,
    dateRangeForProcessing,
    totalContractHours
  );

  const currentWeekIndex = getCurrentWeekIndex(weeklyHoursData);

  const hoursNeeded = calculateHoursNeeded(
    weeklyHoursData,
    currentWeekIndex,
    totalContractHours
  );

  const monthlyChartData = prepareMonthlyChartData(completedDemands);

  if (isLoading) {
    return <LoadingState />;
  }

  if (hasError) {
    return <ErrorState error={hasError} />;
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Consumo de Horas
          {demandsData?.customers_by_pk?.name && (
            <span className="ml-2 text-blue-600">
              - {demandsData.customers_by_pk.name}
            </span>
          )}
          {contractId && contractId !== "0" && selectedContract && (
            <span className="ml-2 text-green-600">
              - Contrato #{contractId}
            </span>
          )}
          {(!contractId || contractId === "0") && activeContractsCount > 1 && (
            <span className="ml-2 text-green-600">
              - {activeContractsCount} Contratos Ativos
            </span>
          )}
        </h1>
        <div className="text-gray-500">
          <Link href="/demands" className="text-blue-600 hover:underline mr-4">
            Ver todas as demandas
          </Link>
          Total:{" "}
          <span className="font-semibold">{allCustomerDemands.length}</span>
        </div>
      </div>

      {allCustomerDemands.length > 0 ? (
        <>
          <HourConsumptionSummary
            totalHoursConsumed={totalHoursConsumed}
            hpd={hpd}
            contractTotalHours={totalContractHours}
            contractStartDate={globalStartDate}
            contractEndDate={globalEndDate}
            formatDate={formatDate}
            activeContractsCount={activeContractsCount}
          />

          <HoursBurnupChart
            weeklyHoursData={weeklyHoursData}
            currentWeekIndex={currentWeekIndex}
            hoursNeeded={hoursNeeded}
            contractTotalHours={totalContractHours}
            startDate={globalStartDate}
            endDate={globalEndDate}
            formatDate={formatDate}
          />

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <MonthlyHoursBarChart chartData={monthlyChartData} />
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  );
}
