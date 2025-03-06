import React, { useState } from 'react';

interface Demand {
  id: string;
  slug: string;
  demand_title: string;
  end_date: string | null;
  hours_consumed: number;
  commitment_date: string | null;
}

interface DemandsTableProps {
  completedDemands: Demand[];
}

export function DemandsTable({ completedDemands }: DemandsTableProps) {
  const [sortField, setSortField] = useState<'date' | 'hours'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Todas as Demandas Entregues</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Título</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
              <th 
                className="py-3 px-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => {
                  if (sortField === 'date') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('date');
                    setSortDirection('desc');
                  }
                }}
              >
                Data Entrega
                {sortField === 'date' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="py-3 px-4 text-right text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200"
                onClick={() => {
                  if (sortField === 'hours') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('hours');
                    setSortDirection('desc');
                  }
                }}
              >
                Horas Consumidas
                {sortField === 'hours' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...completedDemands]
              .sort((a, b) => {
                if (sortField === 'date') {
                  // Sort by end_date
                  if (!a.end_date) return 1;
                  if (!b.end_date) return -1;
                  const comparison = new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
                  return sortDirection === 'asc' ? -comparison : comparison;
                } else {
                  // Sort by hours consumed
                  const comparison = b.hours_consumed - a.hours_consumed;
                  return sortDirection === 'asc' ? -comparison : comparison;
                }
              })
              .map((demand) => {
                const endDate = demand.end_date ? new Date(demand.end_date) : null;
                const formattedDate = endDate 
                  ? `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}` 
                  : 'N/A';
                  
                return (
                  <tr key={demand.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{demand.demand_title}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{demand.id}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{formattedDate}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-blue-700">{demand.hours_consumed.toFixed(2)} horas</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 