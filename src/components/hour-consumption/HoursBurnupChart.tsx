import React from 'react';
import { Line } from 'react-chartjs-2';
import { TooltipItem } from 'chart.js';

interface WeeklyHoursData {
  weekLabel: string;
  totalHours: number;
  consumedHours: number;
}

interface HoursBurnupChartProps {
  weeklyHoursData: WeeklyHoursData[];
  currentWeekIndex: number;
  hoursNeeded: number;
  contractTotalHours: number;
  startDate?: string;
  endDate?: string;
  formatDate: (dateString: string) => string;
}

export function HoursBurnupChart({
  weeklyHoursData,
  currentWeekIndex,
  hoursNeeded,
  contractTotalHours,
  startDate,
  endDate,
  formatDate
}: HoursBurnupChartProps) {
  const formatChartLabel = (weekLabel: string) => {
    const parts = weekLabel.split('/');
    return `${parts[0]}/${parts[1]}`;
  };

  const hoursBurnupData = {
    labels: weeklyHoursData.map(week => formatChartLabel(week.weekLabel)),
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
        label: 'Horas Consumidas',
        data: weeklyHoursData.map(week => week.consumedHours),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1
      },
      {
        label: 'Progresso Ideal',
        data: weeklyHoursData.map((_, index) => {
          const totalWeeks = weeklyHoursData.length;
          if (totalWeeks === 0) return 0;
          
          return (contractTotalHours / totalWeeks) * (index + 1);
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
    maintainAspectRatio: false,
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

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-8 col-span-3">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Escopo e Progresso Ideal do Produto</h2>
      <p className="text-sm text-gray-600 mb-4">Este gráfico mostra o escopo total (horas contratadas), horas consumidas e a linha de progresso ideal ao longo do tempo</p>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="bg-white p-3 rounded-lg flex-grow">
          <div className="h-80 lg:h-[28rem] w-full">
            <Line options={hoursBurnupOptions} data={hoursBurnupData} />
          </div>
        </div>
        <div className="lg:w-80 p-4 bg-orange-50 border border-orange-200 rounded-lg flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">Meta da Semana Atual</h3>
          <p className="text-orange-600 mb-4">Horas necessárias segundo o progresso ideal</p>
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm">
            <span className={`text-3xl font-bold ${hoursNeeded < 0 ? 'text-red-600' : 'text-orange-700'}`}>
              {Math.abs(hoursNeeded).toFixed(0)}
            </span>
            <span className="text-sm text-gray-500 mt-2">horas</span>
            {hoursNeeded < 0 && (
              <div className="mt-2 text-red-600 text-sm font-medium">
                Excedido!
              </div>
            )}
          </div>
          <p className="text-orange-600 text-sm mt-4 text-center">
            {hoursNeeded < 0 
              ? `Excedeu em ${Math.abs(hoursNeeded).toFixed(0)} horas o progresso ideal.` 
              : `Baseado na distribuição ideal de ${contractTotalHours} horas ao longo de ${weeklyHoursData.length} semanas.`
            }
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-3 text-center">
        Escopo e progresso ideal entre {startDate ? formatDate(startDate) : 'N/A'} e {endDate ? formatDate(endDate) : 'N/A'}
        <br />A linha tracejada vermelha indica a semana atual
      </p>
    </div>
  );
} 