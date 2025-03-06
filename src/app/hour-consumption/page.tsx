"use client";

import { gql, useQuery } from "@apollo/client";
import Link from "next/link";
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
  DemandsTable,
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
  }[];
}

const DEMANDS_HOURS_QUERY = gql`
  query CustomerDemandsQuery {
    demands(where: {customer_id: {_eq: 285}}) {
      id
      slug
      demand_title
      commitment_date
      discarded_at
      end_date
      effort_upstream
      effort_downstream
    }
  }
`;

interface ContractsResponse {
  contracts: {
    id: number;
    start_date: string;
    total_hours: number;
    end_date: string;
  }[];
}

interface ProjectResponse {
  projects: {
    id: string;
    start_date: string;
    end_date: string;
  }[];
}

const PROJECTS_QUERY = gql`
  query ProjectsQuery {
    projects(where: {id: {_eq: "2226"}}) {
      id
      start_date
      end_date
    }
  }
`;

const CONTRACTS_QUERY = gql`
  query ContractsQuery {
    contracts(where: {customer_id: {_eq: 285}}) {
      id
      start_date
      total_hours
      end_date
    }
  }
`;

export default function HourConsumptionPage() {
  const { loading: demandsLoading, error: demandsError, data: demandsData } = useQuery<DemandsResponse>(DEMANDS_HOURS_QUERY, {
    fetchPolicy: "network-only",
  });
  
  const { loading: contractsLoading, error: contractsError, data: contractsData } = useQuery<ContractsResponse>(CONTRACTS_QUERY, {
    fetchPolicy: "network-only",
  });
  
  const { loading: projectsLoading, error: projectsError, data: projectsData } = useQuery<ProjectResponse>(PROJECTS_QUERY, {
    fetchPolicy: "network-only",
  });
  
  const loading = demandsLoading || contractsLoading || projectsLoading;
  const error = demandsError || contractsError || projectsError;

  // Process data
  const { allCustomerDemands, completedDemands, totalHoursConsumed, hpd } = processDemandsData(demandsData);
  
  // Get active contract
  const activeContract = getActiveContract(contractsData);
  
  // Calculate contract hours data
  const contractTotalHours = activeContract?.total_hours || 0;
  const hoursUsedPercentage = contractTotalHours > 0 ? (totalHoursConsumed / contractTotalHours) * 100 : 0;
  const hoursRemaining = contractTotalHours - totalHoursConsumed > 0 ? contractTotalHours - totalHoursConsumed : 0;

  // Process weekly hours data for burnup chart
  const weeklyHoursData = processWeeklyHoursData(demandsData, activeContract, projectsData, totalHoursConsumed);
  
  // Find current week index for highlighting
  const currentWeekIndex = getCurrentWeekIndex(weeklyHoursData);
  
  // Calculate hours needed to reach ideal progress
  const hoursNeeded = calculateHoursNeeded(weeklyHoursData, currentWeekIndex, contractTotalHours);
  
  // Prepare monthly chart data
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
        <h1 className="text-3xl font-bold">Consumo de Horas</h1>
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

          <DemandsTable completedDemands={completedDemands} />

          <HoursBurnupChart 
            weeklyHoursData={weeklyHoursData}
            currentWeekIndex={currentWeekIndex}
            hoursNeeded={hoursNeeded}
            contractTotalHours={contractTotalHours}
            projectStartDate={projectsData?.projects?.[0]?.start_date}
            projectEndDate={projectsData?.projects?.[0]?.end_date}
            contractStartDate={activeContract?.start_date}
            contractEndDate={activeContract?.end_date}
            formatDate={formatDate}
          />
        </>
      ) : (
        <EmptyState />
      )}
    </main>
  );
} 