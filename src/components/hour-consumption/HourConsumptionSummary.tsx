import React from 'react';

interface HourConsumptionSummaryProps {
  totalHoursConsumed: number;
  hpd: number;
  contractTotalHours: number;
  contractStartDate?: string;
  contractEndDate?: string;
  formatDate: (dateString: string) => string;
}

export function HourConsumptionSummary({
  totalHoursConsumed,
  hpd,
  contractTotalHours,
  contractStartDate,
  contractEndDate,
  formatDate
}: HourConsumptionSummaryProps) {
  return (
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
            <p className="text-green-600">
              Contrato ativo: {contractStartDate && contractEndDate 
                ? formatDate(contractStartDate) + ' a ' + formatDate(contractEndDate) 
                : 'Nenhum'}
            </p>
          </div>
          <div className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm">
            <span className="text-2xl font-bold text-green-700">{contractTotalHours}</span>
            <span className="text-xs text-gray-500 mt-1">horas</span>
          </div>
        </div>
      </div>
    </div>
  );
} 