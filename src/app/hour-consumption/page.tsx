"use client";

import { gql, useQuery } from "@apollo/client";
import { Card } from "@/components/ui/card";
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
  TooltipItem,
  ArcElement
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import React from 'react';

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

interface DemandWithHours {
  id: string;
  slug: string;
  demand_title: string;
  end_date: string | null;
  hours_consumed: number;
  commitment_date: string | null;
}

interface WeeklyHoursData {
  weekLabel: string;
  totalHours: number;
  consumedHours: number;
}

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

  // State for table sorting
  const [sortField, setSortField] = React.useState<'date' | 'hours'>('date');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

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

  // All customer demands for total hours calculation
  const allCustomerDemands: DemandWithHours[] = [];
  
  // Filter only delivered demands (with end_date) for HpD calculation
  const completedDemands: DemandWithHours[] = [];
  
  if (demandsData?.demands) {
    demandsData.demands.forEach(demand => {
      // Calculate hours consumed by summing effort_upstream and effort_downstream
      const effortUpstream = demand.effort_upstream || 0;
      const effortDownstream = demand.effort_downstream || 0;
      const hoursConsumed = effortUpstream + effortDownstream;
      
      // Add to all customer demands for contract comparison
      allCustomerDemands.push({
        id: demand.id,
        slug: demand.slug,
        demand_title: demand.demand_title,
        end_date: demand.end_date,
        hours_consumed: hoursConsumed,
        commitment_date: demand.commitment_date
      });
      
      // Add only completed demands for HpD calculation
      if (demand.end_date !== null) {
        completedDemands.push({
          id: demand.id,
          slug: demand.slug,
          demand_title: demand.demand_title,
          end_date: demand.end_date,
          hours_consumed: hoursConsumed,
          commitment_date: demand.commitment_date
        });
      }
    });
  }

  // Get active contract
  const activeContract = contractsData?.contracts.find(contract => {
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const now = new Date();
    return startDate <= now && endDate >= now;
  });

  // Calculate total hours consumed for all customer demands
  const totalHoursConsumed = allCustomerDemands.reduce((acc, demand) => acc + demand.hours_consumed, 0);
  
  // Calculate HpD (Hours per Demand) for completed demands
  const totalCompletedDemands = completedDemands.length;
  const hpd = totalCompletedDemands > 0 ? totalHoursConsumed / totalCompletedDemands : 0;
  
  // Calculate contract hours data
  const contractTotalHours = activeContract?.total_hours || 0;
  const hoursUsedPercentage = contractTotalHours > 0 ? (totalHoursConsumed / contractTotalHours) * 100 : 0;
  const hoursRemaining = contractTotalHours - totalHoursConsumed > 0 ? contractTotalHours - totalHoursConsumed : 0;

  // Format contract dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Process demands data to get weekly burnup data for hours
  const processWeeklyHoursData = (): WeeklyHoursData[] => {
    if (!demandsData?.demands || demandsData.demands.length === 0 || !activeContract) {
      return [];
    }

    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;
    const currentDate = new Date();

    if (projectsData?.projects && projectsData.projects.length > 0) {
      const project = projectsData.projects[0];
      if (project.start_date) {
        earliestDate = new Date(project.start_date);
      }
      if (project.end_date) {
        latestDate = new Date(project.end_date);
      }
    }

    if (!earliestDate || !latestDate) {
      earliestDate = new Date(activeContract.start_date);
      latestDate = new Date(activeContract.end_date);
    }

    // 1. Gerar todas as semanas entre a data de início e fim
    const weeks: WeeklyHoursData[] = [];
    const currentWeek = getWeekNumber(earliestDate);
    const endWeek = getWeekNumber(latestDate);
    
    let currentYear = currentWeek[1];
    let weekNum = currentWeek[0];
    
    while (currentYear < endWeek[1] || (currentYear === endWeek[1] && weekNum <= endWeek[0])) {
      weeks.push({
        weekLabel: formatWeekLabel(weekNum, currentYear),
        totalHours: activeContract.total_hours,
        consumedHours: 0
      });
      
      weekNum++;
      if (weekNum > 52) {
        weekNum = 1;
        currentYear++;
      }
    }

    // 2. Calcular as horas consumidas por semana para cada demanda
    const weeklyHours: { [weekLabel: string]: number } = {};
    
    // Inicializar todas as semanas com zero horas
    weeks.forEach(week => {
      weeklyHours[week.weekLabel] = 0;
    });
    
    // Distribuir as horas de cada demanda na semana correspondente
    demandsData.demands.forEach(demand => {
      // Calcular horas consumidas para esta demanda
      const effortUpstream = demand.effort_upstream || 0;
      const effortDownstream = demand.effort_downstream || 0;
      const hoursConsumed = effortUpstream + effortDownstream;
      
      if (hoursConsumed <= 0) return; // Pular demandas sem horas
      
      // Determinar a semana para esta demanda
      let demandDate;
      if (demand.end_date) {
        // Se a demanda foi concluída, usar a data de conclusão
        demandDate = new Date(demand.end_date);
      } else if (demand.commitment_date) {
        // Se não foi concluída mas tem data de compromisso, usar essa data
        demandDate = new Date(demand.commitment_date);
      } else {
        // Se não tem nenhuma data, usar a data atual
        demandDate = currentDate;
      }
      
      // Só considerar demandas até a data atual
      if (demandDate > currentDate) {
        demandDate = currentDate;
      }
      
      // Obter a semana para esta data
      const [weekNum, year] = getWeekNumber(demandDate);
      const weekLabel = formatWeekLabel(weekNum, year);
      
      // Adicionar as horas à semana correspondente se ela existir no nosso período
      if (weeklyHours[weekLabel] !== undefined) {
        weeklyHours[weekLabel] += hoursConsumed;
      } else {
        // Se a semana não existe no nosso período (é anterior ao início do projeto),
        // adicionar as horas à primeira semana
        if (weeks.length > 0) {
          weeklyHours[weeks[0].weekLabel] += hoursConsumed;
        }
      }
    });

    // 3. Calcular o acumulado de horas por semana
    let accumulatedHours = 0;
    weeks.forEach(week => {
      accumulatedHours += weeklyHours[week.weekLabel];
      week.consumedHours = accumulatedHours;
    });

    // 4. Garantir que o valor final acumulado seja exatamente igual ao totalHoursConsumed
    if (weeks.length > 0) {
      // Ajustar o valor final para garantir que seja exatamente igual ao totalHoursConsumed
      const lastWeek = weeks[weeks.length - 1];
      const difference = totalHoursConsumed - lastWeek.consumedHours;
      
      if (Math.abs(difference) > 0.01) { // Usar uma pequena margem para evitar problemas de arredondamento
        // Distribuir a diferença proporcionalmente entre todas as semanas
        const adjustmentPerWeek = difference / weeks.length;
        
        let runningTotal = 0;
        for (let i = 0; i < weeks.length; i++) {
          runningTotal += weeklyHours[weeks[i].weekLabel];
          // Ajustar o valor acumulado para cada semana
          weeks[i].consumedHours = runningTotal + (adjustmentPerWeek * (i + 1));
        }
        
        // Garantir que o último valor seja exatamente igual ao totalHoursConsumed
        weeks[weeks.length - 1].consumedHours = totalHoursConsumed;
      }
    }

    return weeks;
  };

  const weeklyHoursData = processWeeklyHoursData();

  // Find current week index for highlighting
  const getCurrentWeekIndex = (): number => {
    const currentDate = new Date();
    const [currentWeekNum, currentYear] = getWeekNumber(currentDate);
    const currentWeekLabel = formatWeekLabel(currentWeekNum, currentYear);
    
    // Find the closest week if exact match not found
    if (weeklyHoursData.length === 0) return -1;
    
    const exactMatch = weeklyHoursData.findIndex(week => week.weekLabel === currentWeekLabel);
    if (exactMatch !== -1) return exactMatch;
    
    // If no exact match, find the closest week before current date
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    for (let i = 0; i < weeklyHoursData.length; i++) {
      const parts = weeklyHoursData[i].weekLabel.split('/');
      const weekDay = parseInt(parts[0]);
      const weekMonth = parseInt(parts[1]);
      
      // If this week is in a future month or the same month but future day
      if (weekMonth > currentMonth || (weekMonth === currentMonth && weekDay > currentDay)) {
        // Return the previous week, or 0 if this is the first week
        return i > 0 ? i - 1 : 0;
      }
    }
    
    // If we get here, all weeks are before current date, return the last week
    return weeklyHoursData.length - 1;
  };
  
  const currentWeekIndex = getCurrentWeekIndex();

  // Calculate hours needed to reach ideal progress
  const calculateHoursNeeded = (): number => {
    if (weeklyHoursData.length === 0 || currentWeekIndex === -1) return 0;
    
    // Get the ideal progress for the current week
    const totalWeeks = weeklyHoursData.length;
    const contractHours = activeContract?.total_hours || 0;
    const idealProgress = (contractHours / totalWeeks) * (currentWeekIndex + 1);
    
    // Retornar o valor ideal para a semana atual
    return Math.ceil(idealProgress);
  };
  
  const hoursNeeded = calculateHoursNeeded();

  // Prepare chart data for hours burnup
  const hoursBurnupData = {
    labels: weeklyHoursData.map(week => week.weekLabel),
    datasets: [
      {
        label: 'Escopo Total (Horas Contratadas)',
        data: weeklyHoursData.map(week => week.totalHours),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      },
      {
        label: 'Progresso Ideal',
        data: weeklyHoursData.map((_, index) => {
          const totalWeeks = weeklyHoursData.length;
          if (totalWeeks === 0) return 0;
          
          const contractHours = activeContract?.total_hours || 0;
          return (contractHours / totalWeeks) * (index + 1);
        }),
        borderColor: 'rgb(234, 88, 12)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.1,
        pointRadius: 0
      }
    ],
  };

  const hoursBurnupOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Escopo e Progresso Ideal do Produto',
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
              return `${context.dataset.label}: ${context.raw.toFixed(1)} horas`;
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
            borderColor: 'rgba(255, 99, 132, 0.9)',
            borderWidth: 3,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Semana Atual',
              position: 'start' as const,
              backgroundColor: 'rgba(255, 99, 132, 0.9)',
              color: 'white',
              font: {
                weight: 'bold' as const,
                size: 12
              },
              padding: 6
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
          text: 'Horas',
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

  // Prepare contract doughnut chart data
  const contractChartData = {
    labels: ['Horas Utilizadas', 'Horas Restantes'],
    datasets: [
      {
        data: [totalHoursConsumed, hoursRemaining],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(59, 130, 246, 0.7)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(59, 130, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const contractChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            if (typeof context.raw === 'number') {
              const value = context.raw;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value.toFixed(2)} horas (${percentage}%)`;
            }
            return '';
          }
        }
      }
    },
    cutout: '70%',
  };

  // Group demands by month for chart
  const groupDemandsByMonth = () => {
    const grouped: Record<string, { totalHours: number, count: number }> = {};

    completedDemands.forEach(demand => {
      if (!demand.end_date) return;
      
      const endDate = new Date(demand.end_date);
      const monthKey = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = { totalHours: 0, count: 0 };
      }
      
      grouped[monthKey].totalHours += demand.hours_consumed;
      grouped[monthKey].count += 1;
    });

    return grouped;
  };

  const groupedByMonth = groupDemandsByMonth();
  
  // Sort months chronologically
  const sortedMonths = Object.keys(groupedByMonth).sort();
  
  // Prepare data for chart
  const chartData = {
    labels: sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`;
    }),
    datasets: [
      {
        label: 'HpD (Horas por Demanda)',
        data: sortedMonths.map(month => {
          const { totalHours, count } = groupedByMonth[month];
          return count > 0 ? (totalHours / count) : 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Média de Horas por Demanda (HpD) por Mês',
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
          label: function(context: TooltipItem<'bar'>) {
            if (typeof context.raw === 'number') {
              return `HpD: ${context.raw.toFixed(2)} horas`;
            }
            return '';
          }
        },
        backgroundColor: 'rgba(30, 58, 138, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 6,
        padding: 10
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Horas',
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
          text: 'Mês',
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
          <h1 className="text-3xl font-bold">Consumo de Horas</h1>
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
        <h1 className="mb-8 text-3xl font-bold">Consumo de Horas</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-3">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-700">Erro ao carregar dados de consumo</h2>
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
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex flex-col">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-blue-800">Consumo Total de Horas</h2>
                  <p className="text-blue-600">Todas as demandas do produto (Cliente ID: 285)</p>
                </div>
                <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-2xl font-bold text-blue-700">{totalHoursConsumed.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 mt-1">horas</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex flex-col">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-purple-800">HpD (Horas por Demanda)</h2>
                  <p className="text-purple-600">Média de horas consumidas por demanda</p>
                </div>
                <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-2xl font-bold text-purple-700">{hpd.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 mt-1">horas/demanda</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex flex-col">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-green-800">Horas Disponíveis no Contrato</h2>
                  <p className="text-green-600">Contrato ativo: {activeContract ? formatDate(activeContract.start_date) + ' a ' + formatDate(activeContract.end_date) : 'Nenhum'}</p>
                </div>
                <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
                  <span className="text-2xl font-bold text-green-700">{contractTotalHours}</span>
                  <span className="text-xs text-gray-500 mt-1">horas</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Consumo de Horas por Mês</h2>
              <p className="text-sm text-gray-600 mb-4">Todas as demandas, independente do projeto</p>
              <div className="bg-white p-3 rounded-lg h-80">
                <Bar options={chartOptions} data={chartData} />
              </div>
              <p className="text-xs text-blue-700 mt-3 text-center">
                Cada barra representa a média de horas por demanda entregue no mês
              </p>
            </div>
            
            {activeContract && (
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-blue-900 mb-4">Consumo do Contrato</h2>
                <div className="bg-white p-3 rounded-lg h-80 flex items-center justify-center">
                  <div className="w-64 h-64 relative">
                    <Doughnut options={contractChartOptions} data={contractChartData} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm text-gray-500">Utilizado</span>
                      <span className={`text-2xl font-bold ${hoursUsedPercentage > 90 ? 'text-red-600' : 'text-blue-700'}`}>
                        {hoursUsedPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3 text-center">
                  {hoursRemaining.toFixed(2)} horas restantes de {contractTotalHours} horas contratadas
                </p>
                <p className="text-xs text-gray-600 mt-1 text-center">
                  Baseado em todas as {allCustomerDemands.length} demandas do cliente
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Todas as Demandas Entregues</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Título</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                    <th 
                      className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        if (sortField === 'date') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('date');
                          setSortDirection('desc');
                        }
                      }}
                    >
                      Data Entrega
                      {sortField === 'date' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      className="py-3 px-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        if (sortField === 'hours') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField('hours');
                          setSortDirection('desc');
                        }
                      }}
                    >
                      Horas Consumidas
                      {sortField === 'hours' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...completedDemands]
                    .sort((a, b) => {
                      if (sortField === 'date') {
                        // Sort by end_date
                        if (!a.end_date) return 1;
                        if (!b.end_date) return -1;
                        const comparison = new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
                        return sortDirection === 'asc' ? -comparison : comparison;
                      } else {
                        // Sort by hours consumed
                        const comparison = b.hours_consumed - a.hours_consumed;
                        return sortDirection === 'asc' ? -comparison : comparison;
                      }
                    })
                    .map((demand) => {
                    const endDate = demand.end_date ? new Date(demand.end_date) : null;
                    const formattedDate = endDate 
                      ? `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}` 
                      : 'N/A';
                      
                    return (
                      <tr key={demand.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{demand.demand_title}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{demand.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formattedDate}</td>
                        <td className="py-3 px-4 text-sm text-right font-medium text-blue-700">{demand.hours_consumed.toFixed(2)} horas</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Escopo e Progresso Ideal do Produto</h2>
            <p className="text-sm text-gray-600 mb-4">Este gráfico mostra o escopo total (horas contratadas) e a linha de progresso ideal ao longo do tempo</p>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="bg-white p-3 rounded-lg h-80 flex-grow">
                <Line options={hoursBurnupOptions} data={hoursBurnupData} />
              </div>
              <div className="md:w-64 p-4 bg-orange-50 border border-orange-200 rounded-lg flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Meta da Semana Atual</h3>
                <p className="text-orange-600 mb-4">Horas necessárias segundo o progresso ideal</p>
                <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm">
                  <span className="text-3xl font-bold text-orange-700">{hoursNeeded}</span>
                  <span className="text-sm text-gray-500 mt-2">horas</span>
                </div>
                <p className="text-orange-600 text-sm mt-4 text-center">
                  Baseado na distribuição ideal de {activeContract?.total_hours || 0} horas ao longo de {weeklyHoursData.length} semanas.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3 text-center">
              Escopo e progresso ideal entre {projectsData?.projects && projectsData.projects.length > 0 ? formatDate(projectsData.projects[0].start_date) : (activeContract ? formatDate(activeContract.start_date) : 'N/A')} e {projectsData?.projects && projectsData.projects.length > 0 ? formatDate(projectsData.projects[0].end_date) : (activeContract ? formatDate(activeContract.end_date) : 'N/A')}
              <br />A linha tracejada vermelha indica a semana atual
            </p>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Nenhuma demanda entregue encontrada</h2>
          <p className="text-gray-500">
            Não foram encontradas demandas entregues com registro de horas.
          </p>
        </div>
      )}
    </main>
  );
} 