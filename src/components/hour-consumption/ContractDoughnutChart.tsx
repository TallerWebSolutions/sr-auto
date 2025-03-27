import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  TooltipItem,
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Plugin,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ContractDoughnutChartProps {
  totalHoursConsumed: number;
  hoursRemaining: number;
  totalHours: number;
}

export function ContractDoughnutChart({
  totalHoursConsumed,
  hoursRemaining,
  totalHours,
}: ContractDoughnutChartProps) {
  const usedPercentage = Math.round(
    (totalHoursConsumed / totalHours) * 100
  );

  const centerTextPlugin: Plugin<"doughnut"> = {
    id: "centerText",
    afterDraw(chart) {
      const { ctx, width, height } = chart;

      ctx.save();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
      ctx.fillText(`${usedPercentage}%`, width / 2, height / 2 - 10);

      ctx.font = "14px Inter, sans-serif";
      ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
      ctx.fillText("utilizado", width / 2, height / 2 + 15);

      ctx.restore();
    },
  };

  const contractChartData = {
    labels: ["Horas Utilizadas", "Horas Restantes"],
    datasets: [
      {
        data: [totalHoursConsumed, hoursRemaining],
        backgroundColor: ["rgba(239, 68, 68, 0.8)", "rgba(22, 163, 74, 0.8)"],
        borderColor: ["rgb(239, 68, 68)", "rgb(22, 163, 74)"],
        borderWidth: 1,
      },
    ],
  };

  const contractChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<"doughnut">) {
            if (typeof context.raw === "number") {
              const value = context.raw;
              const total = context.dataset.data.reduce(
                (a: number, b: number) => a + b,
                0
              );
              const percentage = Math.round((value / total) * 100);
              return `${context.label}: ${value.toFixed(
                2
              )} horas (${percentage}%)`;
            }
            return "";
          },
        },
      },
    },
    cutout: "75%",
  };

  const contractTitle = "Consumo do Contrato";

  return (
    <div className="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-blue-900 mb-4">{contractTitle}</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-blue-800 font-medium text-sm">
              Total Contratado
            </span>
            <span className="text-blue-900 font-bold text-2xl">
              {totalHours.toFixed(0)}h
            </span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-red-600 font-medium text-sm">
              Horas Utilizadas
            </span>
            <span className="text-red-700 font-bold text-2xl">
              {totalHoursConsumed.toFixed(0)}h
            </span>
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-green-600 font-medium text-sm">
              Horas Restantes
            </span>
            <span className="text-green-700 font-bold text-2xl">
              {hoursRemaining.toFixed(0)}h
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-lg flex flex-col shadow-sm">
        <div className="relative h-64 flex items-center justify-center">
          <Doughnut
            options={contractChartOptions}
            data={contractChartData}
            plugins={[centerTextPlugin]}
          />
        </div>
      </div>
    </div>
  );
}
