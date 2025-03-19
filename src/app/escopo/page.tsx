"use client";

import React from "react";
import { gql, useQuery } from "@apollo/client";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ParameterSelectionButtons } from "@/components/ui/ParameterSelectionButtons";
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
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { MetricCard } from "@/components/ui/MetricCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  }[];
  projects_by_pk?: {
    name: string;
  };
}

interface ProjectResponse {
  projects: {
    id: string;
    start_date: string;
    end_date: string;
    initial_scope: number;
  }[];
}

const getProjectQuery = (projectId: string | null) => gql`
  query ProjectQuery {
    projects(where: {id: {_eq: ${projectId}}}) {
      id
      start_date
      end_date
      initial_scope
    }
  }
`;

const getScopeQuery = (projectId: string | null) => gql`
  query ProjectScopeQuery {
    demands(
      where: {project_id: {_eq: ${projectId}}}, 
      order_by: {end_date: desc, commitment_date: desc}
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

interface DemandWithDates {
  id: string;
  slug: string;
  demand_title: string;
  creation_date: string | null; // Using commitment_date as creation date
  end_date: string | null;
}

interface WeeklyData {
  weekLabel: string;
  totalDemands: number;
  deliveredDemands: number;
}

export default function ScopePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || "0";
  const isProjectIdEmpty = !projectId || projectId === "0";

  const { loading: demandsLoading, error: demandsError, data: demandsData } = useQuery<DemandsResponse>(getScopeQuery(projectId), {
    fetchPolicy: "network-only",
    skip: isProjectIdEmpty
  });
  
  const { loading: projectLoading, error: projectError, data: projectData } = useQuery<ProjectResponse>(getProjectQuery(projectId), {
    fetchPolicy: "network-only",
    skip: isProjectIdEmpty
  });
  
  const loading = demandsLoading || projectLoading;
  const error = demandsError || projectError;

  if (isProjectIdEmpty) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Análise de Escopo</h1>
        </div>
        <ParameterSelectionButtons parameterName="project_id" />
      </main>
    );
  }

  // Format date function
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Get week number and year from date
  const getWeekNumber = (date: Date): [number, number] => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return [weekNumber, date.getFullYear()];
  };

  // Format week label to show the Sunday date
  const formatWeekLabel = (weekNumber: number, year: number): string => {
    // Get the first day of the year
    const firstDayOfYear = new Date(year, 0, 1);
    
    // Calculate the first Sunday of the year
    const dayOfWeek = firstDayOfYear.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysUntilFirstSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const firstSunday = new Date(year, 0, 1 + daysUntilFirstSunday);
    
    // Calculate the Sunday of the given week
    const sundayOfWeek = new Date(firstSunday);
    sundayOfWeek.setDate(firstSunday.getDate() + (weekNumber - 1) * 7);
    
    // Format the date as DD/MM
    const day = sundayOfWeek.getDate().toString().padStart(2, '0');
    const month = (sundayOfWeek.getMonth() + 1).toString().padStart(2, '0');
    
    return `${day}/${month}`;
  };

  // Process demands data to get weekly burnup data
  const processWeeklyData = (): WeeklyData[] => {
    if (!demandsData?.demands || demandsData.demands.length === 0) {
      return [];
    }

    // Filter out discarded demands
    const filteredDemands: DemandWithDates[] = demandsData.demands
      .filter(demand => demand.discarded_at === null)
      .map(demand => ({
        id: demand.id,
        slug: demand.slug,
        demand_title: demand.demand_title,
        creation_date: demand.commitment_date, // Using commitment_date as creation date
        end_date: demand.end_date
      }));

    // Find the earliest and latest dates based on project dates if available
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;
    const currentDate = new Date();

    // Use project start and end dates if available
    if (projectData?.projects && projectData.projects.length > 0) {
      const project = projectData.projects[0];
      if (project.start_date) {
        earliestDate = new Date(project.start_date);
      }
      if (project.end_date) {
        latestDate = new Date(project.end_date);
      }
    }

    // If project dates are not available, fall back to demand dates
    if (!earliestDate || !latestDate) {
      filteredDemands.forEach(demand => {
        if (demand.creation_date) {
          const creationDate = new Date(demand.creation_date);
          if (!earliestDate || creationDate < earliestDate) {
            earliestDate = creationDate;
          }
          if (!latestDate || creationDate > latestDate) {
            latestDate = creationDate;
          }
        }
        
        if (demand.end_date) {
          const endDate = new Date(demand.end_date);
          if (!latestDate || endDate > latestDate) {
            latestDate = endDate;
          }
        }
      });
    }

    if (!earliestDate || !latestDate) {
      return [];
    }

    // Generate all weeks between earliest and latest date
    const weeks: WeeklyData[] = [];
    const currentWeek = getWeekNumber(earliestDate);
    const endWeek = getWeekNumber(latestDate);
    
    let currentYear = currentWeek[1];
    let weekNum = currentWeek[0];
    
    while (currentYear < endWeek[1] || (currentYear === endWeek[1] && weekNum <= endWeek[0])) {
      weeks.push({
        weekLabel: formatWeekLabel(weekNum, currentYear),
        totalDemands: 0,
        deliveredDemands: 0
      });
      
      weekNum++;
      if (weekNum > 52) {
        weekNum = 1;
        currentYear++;
      }
    }

    // Add initial scope to all weeks
    const initialScope = projectData?.projects[0]?.initial_scope || 0;
    weeks.forEach(week => {
      week.totalDemands = initialScope;
    });

    // Count demands created and delivered by week
    filteredDemands.forEach(demand => {
      if (demand.creation_date) {
        const creationDate = new Date(demand.creation_date);
        const [weekNum, year] = getWeekNumber(creationDate);
        const weekLabel = formatWeekLabel(weekNum, year);
        
        // Find the index of this week in our array
        const weekIndex = weeks.findIndex(w => w.weekLabel === weekLabel);
        if (weekIndex !== -1) {
          // Increment all weeks from this point forward
          for (let i = weekIndex; i < weeks.length; i++) {
            weeks[i].totalDemands++;
          }
        }
      } else {
        // For demands without a creation date, count them in the earliest week
        // This ensures ALL demands are counted in the scope
        if (weeks.length > 0) {
          weeks[0].totalDemands++;
          // Propagate to all subsequent weeks
          for (let i = 1; i < weeks.length; i++) {
            weeks[i].totalDemands++;
          }
        }
      }
      
      if (demand.end_date) {
        const endDate = new Date(demand.end_date);
        // Only count delivered demands up to the current date
        if (endDate <= currentDate) {
          const [weekNum, year] = getWeekNumber(endDate);
          const weekLabel = formatWeekLabel(weekNum, year);
          
          // Find the index of this week in our array
          const weekIndex = weeks.findIndex(w => w.weekLabel === weekLabel);
          if (weekIndex !== -1) {
            // Increment all weeks from this point forward
            for (let i = weekIndex; i < weeks.length; i++) {
              weeks[i].deliveredDemands++;
            }
          }
        }
      }
    });

    return weeks;
  };

  const weeklyData = processWeeklyData();
  
  // Find current week index for highlighting
  const getCurrentWeekIndex = (): number => {
    const currentDate = new Date();
    const [currentWeekNum, currentYear] = getWeekNumber(currentDate);
    const currentWeekLabel = formatWeekLabel(currentWeekNum, currentYear);
    
    // Find the closest week if exact match not found
    if (weeklyData.length === 0) return -1;
    
    const exactMatch = weeklyData.findIndex(week => week.weekLabel === currentWeekLabel);
    if (exactMatch !== -1) return exactMatch;
    
    // If no exact match, find the closest week before current date
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    for (let i = 0; i < weeklyData.length; i++) {
      const parts = weeklyData[i].weekLabel.split('/');
      const weekDay = parseInt(parts[0]);
      const weekMonth = parseInt(parts[1]);
      
      // If this week is in a future month or the same month but future day
      if (weekMonth > currentMonth || (weekMonth === currentMonth && weekDay > currentDay)) {
        // Return the previous week, or 0 if this is the first week
        return i > 0 ? i - 1 : 0;
      }
    }
    
    // If we get here, all weeks are before current date, return the last week
    return weeklyData.length - 1;
  };
  
  const currentWeekIndex = getCurrentWeekIndex();
  
  // Prepare chart data for burnup
  const burnupData = {
    labels: weeklyData.map(week => week.weekLabel),
    datasets: [
      {
        label: 'Escopo Total (Todas as Demandas)',
        data: weeklyData.map(week => week.totalDemands),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      },
      {
        label: 'Progresso Ideal',
        data: weeklyData.map((_, index) => {
          const totalWeeks = weeklyData.length;
          if (totalWeeks === 0) return 0;
          
          const latestScope = weeklyData[weeklyData.length - 1].totalDemands;
          return (latestScope / totalWeeks) * (index + 1);
        }),
        borderColor: 'rgb(234, 88, 12)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.1,
        pointRadius: 0
      },
      {
        label: 'Demandas Entregues',
        data: weeklyData.map(week => week.deliveredDemands),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolução do Escopo e Entregas por Semana',
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
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            if (typeof context.raw === 'number') {
              return `${context.dataset.label}: ${context.raw.toFixed(1)} demandas`;
            }
            return '';
          }
        }
      },
      annotation: {
        annotations: {
          currentWeekLine: {
            type: 'line' as const,
            xMin: currentWeekIndex,
            xMax: currentWeekIndex,
            borderColor: 'rgba(255, 99, 132, 0.8)',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Semana Atual',
              position: 'start' as const,
              backgroundColor: 'rgba(255, 99, 132, 0.8)',
              font: {
                weight: 'bold' as const
              }
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Demandas',
          color: '#4b5563',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Data (Domingo de cada semana)',
          color: '#4b5563',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Análise de Escopo</h1>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
        <h1 className="mb-8 text-3xl font-bold">Análise de Escopo</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-700">Erro ao carregar dados de escopo</h2>
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

  // Calculate current metrics
  const totalDemands = (demandsData?.demands.filter(d => d.discarded_at === null).length || 0) + (projectData?.projects[0]?.initial_scope || 0);
  const deliveredDemands = demandsData?.demands.filter(d => d.end_date !== null && d.discarded_at === null).length || 0;
  const completionRate = totalDemands > 0 ? (deliveredDemands / totalDemands) * 100 : 0;

  // Calculate demands needed to reach ideal progress
  const calculateDemandsNeeded = (): number => {
    if (weeklyData.length === 0 || currentWeekIndex === -1) return 0;
    
    // Get the ideal progress for the current week
    const totalWeeks = weeklyData.length;
    const latestScope = weeklyData[weeklyData.length - 1].totalDemands;
    const idealProgress = (latestScope / totalWeeks) * (currentWeekIndex + 1);
    
    // Calculate how many more demands need to be delivered
    const currentDelivered = weeklyData[currentWeekIndex].deliveredDemands;
    const demandsNeeded = Math.max(0, Math.ceil(idealProgress - currentDelivered));
    
    return demandsNeeded;
  };
  
  const demandsNeeded = calculateDemandsNeeded();

  // Get project date information for display
  const projectStartDate = projectData?.projects && projectData.projects.length > 0 ? formatDate(projectData.projects[0].start_date) : "N/A";
  const projectEndDate = projectData?.projects && projectData.projects.length > 0 ? formatDate(projectData.projects[0].end_date) : "N/A";

  return (
    <main className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Análise de Escopo
          {demandsData?.projects_by_pk?.name && (
            <span className="ml-2 text-blue-600">- {demandsData.projects_by_pk.name}</span>
          )}
        </h1>
        <div className="text-gray-500">
          <Link href="/demands" className="text-blue-600 hover:underline mr-4">
            Ver todas as demandas
          </Link>
          Total de demandas: <span className="font-semibold">{totalDemands}</span>
        </div>
      </div>
      
      {demandsData?.demands && demandsData.demands.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <MetricCard
              title="Escopo Total"
              subtitle="Total de demandas no projeto"
              value={totalDemands}
              unit="demandas"
              color="blue"
            />

            <MetricCard
              title="Demandas Entregues"
              subtitle="Demandas concluídas"
              value={deliveredDemands}
              unit="demandas"
              color="green"
            />

            <MetricCard
              title="Taxa de Conclusão"
              subtitle="Percentual de demandas entregues"
              value={`${completionRate.toFixed(1)}%`}
              unit="concluído"
              color="yellow"
            />
          </div>

          <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Evolução do Escopo</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="bg-white p-3 rounded-lg h-96 flex-grow">
                <Line options={chartOptions} data={burnupData} />
              </div>
              <div className="md:w-64 p-4 bg-orange-50 border border-orange-200 rounded-lg flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Meta da Semana Atual</h3>
                <p className="text-orange-600 mb-4">Demandas necessárias para atingir o progresso ideal</p>
                <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm">
                  <span className="text-3xl font-bold text-orange-700">{demandsNeeded}</span>
                  <span className="text-sm text-gray-500 mt-2">demandas pendentes</span>
                </div>
                {demandsNeeded === 0 ? (
                  <p className="text-green-600 text-sm mt-4 text-center">Parabéns! Você está no caminho certo.</p>
                ) : (
                  <p className="text-orange-600 text-sm mt-4 text-center">Entregue mais {demandsNeeded} demanda{demandsNeeded !== 1 ? 's' : ''} para alcançar o progresso ideal.</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 text-center">
              Evolução semanal do escopo total e demandas entregues entre {projectStartDate} e {projectEndDate} (demandas descartadas não são consideradas)
            </p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Demandas do Projeto</h2>
              <div className="text-sm text-gray-500">
                <span className="inline-flex items-center mr-3">
                  <span className="w-3 h-3 inline-block bg-green-100 border border-green-800 rounded-full mr-1"></span>
                  Incluída no escopo
                </span>
                <span className="inline-flex items-center">
                  <span className="w-3 h-3 inline-block bg-red-100 border border-red-800 rounded-full mr-1"></span>
                  Excluída do escopo
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Título</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data Criação</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data Entrega</th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {demandsData.demands.map((demand) => {
                    const creationDate = formatDate(demand.commitment_date);
                    const deliveryDate = formatDate(demand.end_date);
                    const isDelivered = demand.end_date !== null;
                    const isDiscarded = demand.discarded_at !== null;
                    
                    let statusClass = "bg-yellow-100 text-yellow-800"; // In progress
                    let statusText = "Em Andamento";
                    
                    if (isDelivered) {
                      statusClass = "bg-green-100 text-green-800";
                      statusText = "Entregue";
                    } else if (isDiscarded) {
                      statusClass = "bg-red-100 text-red-800";
                      statusText = "Descartada";
                    }
                    
                    // Determine if this demand is included in scope calculations
                    const isIncludedInScope = !isDiscarded;
                    const rowClass = isIncludedInScope ? "" : "opacity-60";
                    
                    return (
                      <tr key={demand.id} className={`hover:bg-gray-50 ${rowClass}`}>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {demand.demand_title}
                          {!isIncludedInScope && (
                            <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Fora do escopo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{creationDate}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{deliveryDate}</td>
                        <td className="py-3 px-4 text-sm text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Nenhuma demanda encontrada</h2>
          <p className="text-gray-500">
            Não foram encontradas demandas para este projeto.
          </p>
        </div>
      )}
    </main>
  );
} 