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
  TooltipItem
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
    effort_upstream: number | null;
    effort_downstream: number | null;
  }[];
}

const DEMANDS_HOURS_QUERY = gql`
  query HoursConsumptionQuery {
    demands(
      where: { project_id: { _eq: 2226 } }
    ) {
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

interface DemandWithHours {
  id: string;
  slug: string;
  demand_title: string;
  end_date: string | null;
  hours_consumed: number;
}

export default function HourConsumptionPage() {
  const { loading, error, data } = useQuery<DemandsResponse>(DEMANDS_HOURS_QUERY, {
    fetchPolicy: "network-only",
  });

  // Filter only delivered demands (with end_date)
  const completedDemands: DemandWithHours[] = [];
  
  if (data?.demands) {
    data.demands.forEach(demand => {
      if (demand.end_date !== null) {
        // Calculate hours consumed by summing effort_upstream and effort_downstream
        const effortUpstream = demand.effort_upstream || 0;
        const effortDownstream = demand.effort_downstream || 0;
        const hoursConsumed = effortUpstream + effortDownstream;
        
        completedDemands.push({
          id: demand.id,
          slug: demand.slug,
          demand_title: demand.demand_title,
          end_date: demand.end_date,
          hours_consumed: hoursConsumed
        });
      }
    });
  }

  // Calculate HpD (Hours per Demand)
  const calculateHpD = () => {
    if (completedDemands.length === 0) return 0;
    
    const totalHours = completedDemands.reduce((acc, demand) => acc + demand.hours_consumed, 0);
    return totalHours / completedDemands.length;
  };

  const hpd = calculateHpD();

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

  // Top demands by hours consumed
  const topDemandsByHours = [...completedDemands]
    .sort((a, b) => b.hours_consumed - a.hours_consumed)
    .slice(0, 5);

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
          Total entregues: <span className="font-semibold">{completedDemands.length}</span>
        </div>
      </div>
      
      {completedDemands.length > 0 ? (
        <>
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-3 md:mb-0">
                <h2 className="text-lg font-semibold text-blue-800">Estatísticas de Consumo de Horas</h2>
                <p className="text-blue-600">Baseado em {completedDemands.length} demandas entregues</p>
              </div>
              <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="text-sm text-gray-500">HpD (Horas por Demanda)</span>
                <span className="text-2xl font-bold text-blue-700">{hpd.toFixed(2)} horas</span>
                <span className="text-xs text-gray-500 mt-1">Média de horas consumidas por demanda</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Evolução de HpD por Mês</h2>
              <div className="bg-white p-3 rounded-lg h-80">
                <Bar options={chartOptions} data={chartData} />
              </div>
              <p className="text-xs text-blue-700 mt-3 text-center">
                Cada barra representa a média de horas por demanda entregue no mês
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Top 5 Demandas por Consumo de Horas</h2>
              {topDemandsByHours.length > 0 ? (
                <div className="space-y-4">
                  {topDemandsByHours.map((demand) => (
                    <div key={demand.id} className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-blue-800 text-sm mb-1">
                        {demand.demand_title}
                      </h3>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">ID: {demand.id}</span>
                        <span className="font-medium text-blue-700">{demand.hours_consumed} horas</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  Nenhuma demanda com horas registradas
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-blue-900 mb-4">Todas as Demandas Entregues</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="py-2 px-4 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Título</th>
                    <th className="py-2 px-4 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">ID</th>
                    <th className="py-2 px-4 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Data Entrega</th>
                    <th className="py-2 px-4 text-right text-xs font-medium text-blue-900 uppercase tracking-wider">Horas Consumidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {completedDemands.map((demand) => {
                    const endDate = demand.end_date ? new Date(demand.end_date) : null;
                    const formattedDate = endDate 
                      ? `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}` 
                      : 'N/A';
                      
                    return (
                      <tr key={demand.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 text-sm">{demand.demand_title}</td>
                        <td className="py-2 px-4 text-sm text-gray-500">{demand.id}</td>
                        <td className="py-2 px-4 text-sm">{formattedDate}</td>
                        <td className="py-2 px-4 text-sm text-right font-medium text-blue-700">{demand.hours_consumed} horas</td>
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
          <h2 className="text-xl font-semibold mb-2">Nenhuma demanda entregue encontrada</h2>
          <p className="text-gray-500">
            Não foram encontradas demandas entregues com registro de horas.
          </p>
        </div>
      )}
    </main>
  );
} 