"use client";

import { gql, useQuery } from "@apollo/client";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { DemandCard } from "@/components/ui/DemandCard";
import { useSearchParams } from "next/navigation";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useCustomerStore } from "@/stores/customerStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DemandsResponse {
  demands: {
    id: string;
    slug: string;
    demand_title: string;
    commitment_date: string | null;
    discarded_at: string | null;
    end_date: string | null;
  }[];
  projects_by_pk: {
    name: string;
  };
}

const getDemandsQuery = (projectId: string | null) => gql`
  query DemandsQuery {
    demands(
      where: { project_id: { _eq: ${projectId} } }
      order_by: { end_date: desc }
    ) {
      id
      slug
      demand_title
      commitment_date
      discarded_at
      end_date
    }
    projects_by_pk(
      id: ${projectId}
    ) {
      name
    }
  }
`;

interface DemandWithLeadTime {
  id: string;
  slug: string;
  demand_title: string;
  commitment_date: string;
  end_date: string;
  discarded_at: string | null;
  lead_time_days: number;
}

// ProjectSelectionWrapper component to handle automatic selection when there's only one project
function ProjectSelectionWrapper() {
  const { selectedCustomer } = useCustomerStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowSelector, setShouldShowSelector] = useState(false);

  // Custom query to get projects for the current customer
  const getProjectsQuery = gql`
    query GetProjects {
      projects(where: {products_projects: {product: {customer_id: {_eq: ${selectedCustomer?.id || null}}}, project: {status: {_eq: 1}}}}) {
        id
        name
        status
      }
    }
  `;

  const { loading, error, data } = useQuery(getProjectsQuery, {
    skip: !selectedCustomer?.id,
    fetchPolicy: "network-only"
  });

  useEffect(() => {
    if (loading || !data) return;

    const projects = data.projects || [];

    // If no projects, show selector with empty state
    if (projects.length === 0) {
      setIsLoading(false);
      setShouldShowSelector(true);
      return;
    }

    // If only one project, automatically select it
    if (projects.length === 1) {
      const projectId = projects[0].id;
      router.push(`${window.location.pathname}?project_id=${projectId}`);
      return;
    }

    // If multiple projects, show selector
    setIsLoading(false);
    setShouldShowSelector(true);
  }, [data, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Carregando projetos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Erro ao carregar projetos</h3>
        <p className="text-red-500 mb-4">{error.message}</p>
      </div>
    );
  }

  if (shouldShowSelector) {
    return <ParameterSelectionButtons parameterName="project_id" />;
  }

  return null;
}

export default function LeadTimesPage() {
  const { selectedCustomer } = useCustomerStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project_id') || "0";
  const isProjectIdEmpty = !projectId || projectId === "0";

  const { loading, error, data } = useQuery<DemandsResponse>(getDemandsQuery(projectId), {
    fetchPolicy: "network-only",
    skip: isProjectIdEmpty
  });

  // Store previous customer ID to detect changes
  const [previousCustomerId, setPreviousCustomerId] = useState<number | null>(null);

  // When customer changes, reset the URL to remove project_id
  useEffect(() => {
    // If this is the first render or if the customer ID hasn't changed, do nothing
    if (previousCustomerId === null) {
      setPreviousCustomerId(selectedCustomer?.id || null);
      return;
    }

    // If customer has changed and a project is selected, reset the URL
    if (previousCustomerId !== selectedCustomer?.id && !isProjectIdEmpty) {
      router.push(window.location.pathname);
    }

    // Update the previous customer ID
    setPreviousCustomerId(selectedCustomer?.id || null);
  }, [selectedCustomer, isProjectIdEmpty, previousCustomerId, router]);

  if (isProjectIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Lead Times</h1>
        </div>
        <ProjectSelectionWrapper />
      </main>
    );
  }

  const demandsWithLeadTimes: DemandWithLeadTime[] = [];

  if (data?.demands) {
    data.demands.forEach(demand => {
      if (
        demand.discarded_at !== null ||
        demand.end_date === null ||
        demand.commitment_date === null
      ) {
        return;
      }

      const endDate = new Date(demand.end_date);
      const commitmentDate = new Date(demand.commitment_date);
      const diffTime = Math.abs(endDate.getTime() - commitmentDate.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      demandsWithLeadTimes.push({
        id: demand.id,
        slug: demand.slug,
        demand_title: demand.demand_title,
        commitment_date: demand.commitment_date,
        end_date: demand.end_date,
        discarded_at: demand.discarded_at,
        lead_time_days: diffDays
      });
    });
  }

  const calculateP80 = (values: number[]): string => {
    if (values.length === 0) return "0";

    const sortedValues = [...values].sort((a, b) => a - b);

    const desiredPercentile = 80;
    const rank = (desiredPercentile / 100.0) * (sortedValues.length - 1);

    const lowerIndex = Math.floor(rank);

    const lower = sortedValues[lowerIndex];
    const upper = sortedValues[lowerIndex + 1];

    const interpolatedValue = lower + ((upper - lower) * (rank - lowerIndex));

    return interpolatedValue.toFixed(2);
  };

  const leadTimeValues = demandsWithLeadTimes.map(demand => demand.lead_time_days);

  const p80LeadTime = calculateP80(leadTimeValues);

  const getSundayOfWeek = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    if (day === 0) {
      return result;
    }
    const daysUntilNextSunday = 7 - day;
    result.setDate(result.getDate() + daysUntilNextSunday);
    return result;
  };

  const getStartOfWeek = (date: Date): Date => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 6 : day - 1;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
  };

  const formatWeekRange = (startOfWeek: Date): string => {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const formatDay = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const month = months[date.getMonth()];
      return `${day}/${month}`;
    };

    return `${formatDay(startOfWeek)} - ${formatDay(endOfWeek)}`;
  };

  const formatChartDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const month = months[date.getMonth()];
    return `${day}/${month}`;
  };

  const generateWeeklyP80Data = () => {
    if (demandsWithLeadTimes.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sortedDemands = [...demandsWithLeadTimes].sort(
      (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
    );

    const firstEndDate = new Date(sortedDemands[0].end_date);
    const firstWeekSunday = getSundayOfWeek(firstEndDate);

    const lastDate = new Date();
    const lastWeekSunday = getSundayOfWeek(lastDate);

    const sundays: Date[] = [];
    let nextSunday = new Date(firstWeekSunday);

    while (nextSunday <= lastWeekSunday) {
      sundays.push(new Date(nextSunday));
      const newDate = new Date(nextSunday);
      newDate.setDate(newDate.getDate() + 7);
      nextSunday = newDate;
    }

    const weeklyP80Values: number[] = [];

    sundays.forEach((sunday, index) => {
      const demandsUpToDate = sortedDemands.filter(
        demand => new Date(demand.end_date) <= sunday
      );

      if (demandsUpToDate.length > 0) {
        const leadTimesUpToDate = demandsUpToDate.map(d => d.lead_time_days);
        const p80Value = parseFloat(calculateP80(leadTimesUpToDate));
        weeklyP80Values.push(p80Value);
      } else if (index > 0) {
        weeklyP80Values.push(weeklyP80Values[index - 1]);
      } else {
        weeklyP80Values.push(0);
      }
    });

    const labels = sundays.map(formatChartDate);

    return {
      labels,
      datasets: [
        {
          label: 'P80 Lead Time (dias)',
          data: weeklyP80Values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolução do P80 de Lead Time por Semana',
        color: '#1e3a8a',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            if (typeof context.raw === 'number') {
              return `P80: ${context.raw.toFixed(2)} dias`;
            }
            return '';
          }
        },
        backgroundColor: 'rgba(30, 58, 138, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Dias',
          color: '#1e3a8a',
          font: {
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#1e40af'
        },
        grid: {
          color: 'rgba(219, 234, 254, 0.5)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Semana (término no domingo)',
          color: '#1e3a8a',
          font: {
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#1e40af'
        },
        grid: {
          color: 'rgba(219, 234, 254, 0.5)'
        }
      }
    }
  };

  const chartData = generateWeeklyP80Data();

  const groupDemandsByWeek = () => {
    const groupedDemands: Record<string, DemandWithLeadTime[]> = {};

    const sortedDemands = [...demandsWithLeadTimes].sort(
      (a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    );

    sortedDemands.forEach(demand => {
      const endDate = new Date(demand.end_date);
      const startOfWeek = getStartOfWeek(endDate);
      const weekKey = startOfWeek.toISOString();

      if (!groupedDemands[weekKey]) {
        groupedDemands[weekKey] = [];
      }

      groupedDemands[weekKey].push(demand);
    });

    return groupedDemands;
  };

  const groupedDemands = groupDemandsByWeek();
  const weekKeys = Object.keys(groupedDemands).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            Lead Times
            <span className="ml-2">
              <div className="inline-block h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </span>
          </h1>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mt-3"></div>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto p-4">
        <h1 className="mb-8 text-3xl font-bold">
          Lead Times
          {data?.projects_by_pk?.name && (
            <span className="ml-2 text-blue-600">- {data.projects_by_pk.name}</span>
          )}
        </h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-700">Erro ao carregar dados</h2>
          </div>
          <div className="text-red-500 bg-red-100 p-3 rounded">
            {error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Lead Times
          {data?.projects_by_pk?.name && (
            <span className="ml-2 text-blue-600">- {data.projects_by_pk.name}</span>
          )}
        </h1>
        <div className="text-gray-500">
          <Link href="/demands" className="text-blue-600 hover:underline mr-4">
            Ver todas as demandas
          </Link>
          Total entregues: <span className="font-semibold">{demandsWithLeadTimes.length}</span>
        </div>
      </div>

      {demandsWithLeadTimes.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <MetricCard
              title="Lead Time P80"
              subtitle={`Baseado em ${demandsWithLeadTimes.length} demandas do projeto`}
              value={p80LeadTime}
              unit="dias"
              color="green"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-1 mb-8">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Evolução do Lead Time P80</h2>
              <p className="text-sm text-gray-600 mb-4">Dados do projeto ID: {projectId}</p>
              <div className="h-80 bg-white p-3 rounded-lg">
                <Line options={chartOptions} data={chartData} />
              </div>
              <p className="text-xs text-gray-600 mt-3 text-center">
                Cada ponto representa o P80 calculado com todas as demandas concluídas até o domingo daquela semana
              </p>
            </div>
          </div>

          <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Demandas Entregues</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Título</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data Início</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data Entrega</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {demandsWithLeadTimes
                    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())
                    .map((demand) => (
                      <tr key={demand.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{demand.demand_title}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{new Date(demand.commitment_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{new Date(demand.end_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-blue-700">{demand.lead_time_days.toFixed(1)} dias</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lead Time por Semana</h2>
            <div className="overflow-x-auto">
              {weekKeys.length > 0 ? (
                <div className="space-y-8">
                  {weekKeys.map(weekKey => {
                    const startOfWeek = new Date(weekKey);
                    const weekRange = formatWeekRange(startOfWeek);
                    const weekDemands = groupedDemands[weekKey];

                    return (
                      <div key={weekKey} className="mb-8">
                        <div className="flex items-center mb-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                          <h3 className="text-xl font-bold text-blue-900">Semana: {weekRange}</h3>
                          <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                            {weekDemands.length} demanda{weekDemands.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {weekDemands.map((demand) => (
                            <DemandCard
                              key={demand.id}
                              demand={demand}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 className="text-xl font-semibold mb-2">Nenhuma demanda com lead time válido</h2>
                  <p className="text-gray-500">
                    Não foram encontradas demandas com datas de início e fim válidas, ou todas foram descartadas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Nenhuma demanda com lead time válido</h2>
          <p className="text-gray-500">
            Não foram encontradas demandas com datas de início e fim válidas, ou todas foram descartadas.
          </p>
        </div>
      )}
    </main>
  );
}