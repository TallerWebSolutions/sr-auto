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
  ArcElement
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import React from 'react';
import {
  HourConsumptionSummary,
  ContractDoughnutChart,
  MonthlyHoursBarChart,
  HoursBurnupChart,
  LoadingState,
  ErrorState,
  EmptyState,
  formatDate,
  processDemandsData,
  getActiveContract,
  processWeeklyHoursData,
  getCurrentWeekIndex,
  calculateHoursNeeded,
  prepareMonthlyChartData
} from '@/components/hour-consumption';
import { EmptyStateParameterRequired } from '@/components/ui/EmptyStateParameterRequired';

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

const getCustomerDemandsQuery = (customerId: string | null, contractId: string | null) => {
  let whereClause = `{customer_id: {_eq: ${customerId}}`;
  
  if (contractId && contractId !== "0") {
    whereClause += `, contract_id: {_eq: ${contractId}}`;
  }
  
  whereClause += `}`;
  
  return gql`
    query CustomerDemandsQuery {
      demands(where: ${whereClause}) {
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

const getContractsQuery = (customerId: string | null) => gql`
  query ContractsQuery {
    contracts(where: {customer_id: {_eq: ${customerId}}}) {
      id
      start_date
      total_hours
      end_date
    }
  }
`;

export default function HourConsumptionPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customer_id') || "0";
  const contractId = searchParams.get('contract_id') || "0";
  const isCustomerIdEmpty = !customerId || customerId === "0";

  const { loading: demandsLoading, error: demandsError, data: demandsData } = useQuery<DemandsResponse>(
    getCustomerDemandsQuery(customerId, contractId), {
    fetchPolicy: "network-only",
    skip: isCustomerIdEmpty
  });
  
  const { loading: contractsLoading, error: contractsError, data: contractsData } = useQuery<ContractsResponse>(
    getContractsQuery(customerId), {
    fetchPolicy: "network-only",
    skip: isCustomerIdEmpty
  });
  
  const loading = demandsLoading || contractsLoading;
  const error = demandsError || contractsError;

  if (isCustomerIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Consumo de Horas</h1>
        </div>
        <EmptyStateParameterRequired paramName="customer_id" />
      </main>
    );
  }

  const { allCustomerDemands, completedDemands, totalHoursConsumed, hpd } = processDemandsData(demandsData);
  
  const activeContract = contractId && contractId !== "0" 
    ? contractsData?.contracts.find(contract => contract.id.toString() === contractId)
    : getActiveContract(contractsData);
  
  const contractTotalHours = activeContract?.total_hours || 0;
  const hoursUsedPercentage = contractTotalHours > 0 ? (totalHoursConsumed / contractTotalHours) * 100 : 0;
  const hoursRemaining = contractTotalHours - totalHoursConsumed > 0 ? contractTotalHours - totalHoursConsumed : 0;

  const weeklyHoursData = processWeeklyHoursData(demandsData, activeContract);
  
  const currentWeekIndex = getCurrentWeekIndex(weeklyHoursData);
  
  const hoursNeeded = calculateHoursNeeded(weeklyHoursData, currentWeekIndex, contractTotalHours);
  
  const monthlyChartData = prepareMonthlyChartData(completedDemands);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Consumo de Horas
          {demandsData?.customers_by_pk?.name && (
            <span className="ml-2 text-blue-600">- {demandsData.customers_by_pk.name}</span>
          )}
          {contractId && contractId !== "0" && activeContract && (
            <span className="ml-2 text-green-600">- Contrato #{contractId}</span>
          )}
        </h1>
        <div className="text-gray-500">
          <Link href="/demands" className="text-blue-600 hover:underline mr-4">
            Ver todas as demandas
          </Link>
          Total: <span className="font-semibold">{allCustomerDemands.length}</span>
        </div>
      </div>
      
      {allCustomerDemands.length > 0 ? (
        <>
          <HourConsumptionSummary 
            totalHoursConsumed={totalHoursConsumed}
            hpd={hpd}
            contractTotalHours={contractTotalHours}
            contractStartDate={activeContract?.start_date}
            contractEndDate={activeContract?.end_date}
            formatDate={formatDate}
          />

          <HoursBurnupChart 
            weeklyHoursData={weeklyHoursData}
            currentWeekIndex={currentWeekIndex}
            hoursNeeded={hoursNeeded}
            contractTotalHours={contractTotalHours}
            startDate={activeContract?.start_date}
            endDate={activeContract?.end_date}
            formatDate={formatDate}
          />

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <MonthlyHoursBarChart chartData={monthlyChartData} />
            
            {activeContract && (
              <ContractDoughnutChart 
                totalHoursConsumed={totalHoursConsumed}
                hoursRemaining={hoursRemaining}
                contractTotalHours={contractTotalHours}
                hoursUsedPercentage={hoursUsedPercentage}
                allCustomerDemandsCount={allCustomerDemands.length}
              />
            )}
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  );
} 