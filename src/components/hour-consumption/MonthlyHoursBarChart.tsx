import React from 'react';
import { Bar } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';

interface MonthlyHoursBarChartProps {
  chartData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  };
}

export function MonthlyHoursBarChart({ chartData }: MonthlyHoursBarChartProps) {
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

  return (
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
  );
} 