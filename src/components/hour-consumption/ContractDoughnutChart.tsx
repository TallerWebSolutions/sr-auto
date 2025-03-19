import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';

interface ContractDoughnutChartProps {
  totalHoursConsumed: number;
  hoursRemaining: number;
  contractTotalHours: number;
  hoursUsedPercentage: number;
}

export function ContractDoughnutChart({
  totalHoursConsumed,
  hoursRemaining,
  contractTotalHours,
  hoursUsedPercentage,
}: ContractDoughnutChartProps) {
  const contractChartData = {
    labels: ['Horas Utilizadas', 'Horas Restantes'],
    datasets: [
      {
        data: [totalHoursConsumed, hoursRemaining],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(22, 163, 74, 0.7)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(22, 163, 74)',
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

  return (
    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-blue-900 mb-4">Consumo do Contrato</h2>
      <div className="bg-white p-3 rounded-lg h-80 flex items-center justify-center">
        <div className="w-64 h-64 relative">
          <Doughnut options={contractChartOptions} data={contractChartData} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500">Utilizado</span>
            <span className={`text-2xl font-bold ${hoursUsedPercentage > 90 ? 'text-red-600' : 'text-red-600'}`}>
              {hoursUsedPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-green-700 mt-3 text-center">
        {hoursRemaining.toFixed(0)} horas restantes de {contractTotalHours} horas contratadas
      </p>
    </div>
  );
} 