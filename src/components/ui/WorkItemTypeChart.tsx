import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem 
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WorkItemTypeChartProps {
  demands: {
    work_item_type_id: number | null;
    end_date: string | null;
  }[];
}

const workItemTypeConfig: Record<number, { name: string; color: string }> = {
  20: { name: 'Bug', color: '#F56565' },     // Vermelho
  31: { name: 'Chore', color: '#ECC94B' },   // Amarelo
  36: { name: 'Story', color: '#48BB78' },   // Verde
};

export function WorkItemTypeChart({ demands }: WorkItemTypeChartProps) {
  const completedDemands = demands.filter(demand => demand.end_date !== null);
  
  // Agrupar demandas por tipo
  const workItemTypeCounts: Record<string, number> = {};
  
  completedDemands.forEach(demand => {
    const typeId = demand.work_item_type_id;
    const typeName = typeId && workItemTypeConfig[typeId] 
      ? workItemTypeConfig[typeId].name 
      : (typeId ? `Tipo ${typeId}` : 'Não definido');
    
    workItemTypeCounts[typeName] = (workItemTypeCounts[typeName] || 0) + 1;
  });
  
  // Preparar dados para o gráfico de barras horizontal
  const labels = ['Demandas Finalizadas'];
  const datasets = Object.entries(workItemTypeCounts).map(([typeName, count]) => {
    // Encontrar a cor correspondente ao tipo
    let color = '#A0AEC0'; // Cinza para tipos não mapeados
    
    // Procurar o ID do tipo pelo nome
    for (const [, config] of Object.entries(workItemTypeConfig)) {
      if (config.name === typeName) {
        color = config.color;
        break;
      }
    }
    
    return {
      label: `${typeName} (${count})`,
      data: [count],
      backgroundColor: color,
    };
  });
  
  const total = completedDemands.length;
  
  const chartData = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const, // Torna o gráfico horizontal
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Quantidade',
        },
      },
      y: {
        stacked: true,
        ticks: {
          precision: 0,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const label = context.dataset.label || '';
            const value = context.parsed.x; // Mudado de y para x devido à orientação horizontal
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Distribuição por Tipo de Item de Trabalho (Demandas Finalizadas)</CardTitle>
          <div className="text-sm text-gray-500">
            Total finalizado: <span className="font-semibold">{completedDemands.length}</span> de {demands.length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {completedDemands.length > 0 ? (
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={options} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-center">Não há demandas finalizadas para exibir no gráfico</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 