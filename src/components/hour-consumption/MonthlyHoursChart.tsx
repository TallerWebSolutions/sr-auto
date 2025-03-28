import { MONTH_NAMES } from "@/lib/constants";
import { Plugin, TooltipItem } from "chart.js";
import { Bar } from "react-chartjs-2";
import { WeeklyHoursData } from "./utils";

type MonthlyHoursChartProps = {
  weeklyHoursData: WeeklyHoursData[];
};

export function MonthlyHoursChart({ weeklyHoursData }: MonthlyHoursChartProps) {
  const weeklyNonAccumulatedHours = weeklyHoursData.map((week, index, array) =>
    index === 0
      ? { ...week, nonAccumulatedHours: week.consumedHours }
      : {
          ...week,
          nonAccumulatedHours:
            week.consumedHours - array[index - 1].consumedHours,
        }
  );

  const monthlyData = weeklyNonAccumulatedHours.reduce((acc, week) => {
    const [, month, year] = week.weekLabel.split("/");
    const monthKey = `${year}-${month.padStart(2, "0")}`;

    acc[monthKey] = (acc[monthKey] || 0) + week.nonAccumulatedHours;
    return acc;
  }, {} as Record<string, number>);

  const sortedMonths = Object.keys(monthlyData).sort();
  const monthLabels = sortedMonths.map((month) => {
    const [year, monthNum] = month.split("-");
    return `${MONTH_NAMES[parseInt(monthNum) - 1]}/${year}`;
  });
  const monthValues = sortedMonths.map((month) => monthlyData[month]);

  const data = {
    labels: monthLabels,
    datasets: [
      {
        label: "Horas Consumidas por Mês",
        data: monthValues,
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgb(53, 162, 235)",
        borderWidth: 1,
      },
    ],
  };

  const valueLabelsPlugin: Plugin<"bar"> = {
    id: "valueLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;

        meta.data.forEach((element, index) => {
          const value = dataset.data[index] as number;
          const position = (
            element as unknown as { getCenterPoint(): { x: number; y: number } }
          ).getCenterPoint();

          ctx.fillStyle = "#333";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.font = "bold 12px Arial";

          ctx.fillText(`${value.toFixed(1)}h`, position.x, position.y - 10);
        });
      });
    },
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Consumo Mensal de Horas",
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) =>
            `${context.dataset.label}: ${context.parsed.y.toFixed(1)}h`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Horas",
        },
      },
    },
  };

  return (
    <div className="col-span-2 bg-white p-6 rounded-lg shadow">
      <div style={{ height: "400px" }}>
        <Bar options={options} data={data} plugins={[valueLabelsPlugin]} />
      </div>
    </div>
  );
}
