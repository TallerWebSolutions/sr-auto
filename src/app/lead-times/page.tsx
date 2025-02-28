"use client";

import { gql, useQuery } from "@apollo/client";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { DemandCard } from "@/components/ui/DemandCard";
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
}

const DEMANDS_QUERY = gql`
  query MyQuery {
    demands(
      where: { project_id: { _eq: 2226 } }
      order_by: { end_date: desc }
    ) {
      id
      slug
      demand_title
      commitment_date
      discarded_at
      end_date
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

export default function LeadTimesPage() {
  const { loading, error, data } = useQuery<DemandsResponse>(DEMANDS_QUERY, {
    fetchPolicy: "network-only",
  });

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
    const diff = day === 0 ? 0 : 7 - day;
    result.setDate(result.getDate() + diff);
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
    
    const lastDate = new Date('2025-03-01');
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
          <h1 className="text-3xl font-bold">Lead Times de Demandas</h1>
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
        <h1 className="mb-8 text-3xl font-bold">Lead Times de Demandas</h1>
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
        <h1 className="text-3xl font-bold">Lead Times de Demandas</h1>
        <div className="text-gray-500">
          <Link href="/demands" className="text-blue-600 hover:underline mr-4">
            Ver todas as demandas
          </Link>
          Total válidas: <span className="font-semibold">{demandsWithLeadTimes.length}</span>
        </div>
      </div>
      
      {demandsWithLeadTimes.length > 0 ? (
        <>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-3 md:mb-0">
                <h2 className="text-lg font-semibold text-blue-800">Estatísticas de Lead Time</h2>
                <p className="text-blue-600">Baseado em {demandsWithLeadTimes.length} demandas concluídas</p>
              </div>
              <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="text-sm text-gray-500">P80 de Lead Time</span>
                <span className="text-2xl font-bold text-blue-700">{p80LeadTime} dias</span>
                <span className="text-xs text-gray-500 mt-1">80% das demandas abaixo deste valor</span>
              </div>
            </div>
          </div>

          <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Evolução Semanal do P80</h2>
            <div className="h-80 bg-white p-3 rounded-lg">
              <Line options={chartOptions} data={chartData} />
            </div>
            <p className="text-xs text-blue-700 mt-3 text-center">
              Cada ponto representa o P80 calculado com todas as demandas concluídas até o domingo daquela semana
            </p>
          </div>

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