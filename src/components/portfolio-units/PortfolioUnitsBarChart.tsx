'use client'

import { Bar } from 'react-chartjs-2';
import { PortfolioUnit } from './PortfolioUnitsView';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register the components we need for the chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PortfolioUnitsBarChartProps {
  units: PortfolioUnit[];
  loading: boolean;
  error?: Error;
}

export function PortfolioUnitsBarChart({ units, loading, error }: PortfolioUnitsBarChartProps) {
  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar unidades</div>;

  // Calculate total hours for each unit
  const processedUnits = units.map(unit => {
    const upstreamHours = unit.demands_aggregate.aggregate.sum.effort_upstream || 0;
    const downstreamHours = unit.demands_aggregate.aggregate.sum.effort_downstream || 0;
    const totalHours = upstreamHours + downstreamHours;
    
    return {
      name: unit.name,
      totalHours,
      id: unit.id
    };
  });

  // Sort by total hours (descending)
  const sortedUnits = [...processedUnits].sort((a, b) => b.totalHours - a.totalHours);
  
  // Limit to top 15 units for better visibility
  const topUnits = sortedUnits.slice(0, 15);

  const chartData = {
    labels: topUnits.map(unit => unit.name),
    datasets: [
      {
        label: 'Horas Totais',
        data: topUnits.map(unit => unit.totalHours),
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // blue-500 with opacity
        borderColor: 'rgb(37, 99, 235)', // blue-600
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Horas por Unidade de Portfolio',
        color: '#1e3a8a', // blue-900
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.formattedValue} horas`;
          }
        },
        backgroundColor: 'rgba(30, 58, 138, 0.8)', // blue-900 with opacity
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 6,
        padding: 10
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Horas',
          color: '#4b5563', // gray-600
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Unidades',
          color: '#4b5563', // gray-600
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 h-full">
      <div className="h-[500px]">
        <Bar options={chartOptions} data={chartData} />
      </div>
      <p className="text-xs text-blue-700 mt-3 text-center">
        Exibindo as {topUnits.length} unidades com maior consumo de horas
      </p>
    </div>
  );
} 