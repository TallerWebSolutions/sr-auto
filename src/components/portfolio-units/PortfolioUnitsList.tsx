'use client'

import { Badge } from "../ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { PortfolioUnit } from "./PortfolioUnitsView";

interface PortfolioUnitsListProps {
  units: PortfolioUnit[];
  loading: boolean;
  error?: Error;
  sorting: { field: 'hours' | 'name', direction: 'asc' | 'desc' };
  onSortChange: Dispatch<SetStateAction<{ field: 'hours' | 'name', direction: 'asc' | 'desc' }>>;
}

const portfolioUnitTypeMap: Record<string, { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
  "0": { label: "Módulo de Produto", variant: "secondary" },
  "1": { label: "Estágio de Jornada", variant: "outline" },
  "2": { label: "Tema", variant: "destructive" },
  "4": { label: "Épico", variant: "default" }
};

export function PortfolioUnitsList({ units, loading, error, sorting, onSortChange }: PortfolioUnitsListProps) {
  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar unidades</div>;

  const getTotalHours = (unit: PortfolioUnit): number => {
    const upstreamHours = unit.demands_aggregate.aggregate.sum.effort_upstream || 0;
    const downstreamHours = unit.demands_aggregate.aggregate.sum.effort_downstream || 0;
    return upstreamHours + downstreamHours;
  };

  const sortedUnits = [...units].sort((a, b) => {
    if (sorting.field === 'hours') {
      const multiplier = sorting.direction === 'desc' ? -1 : 1;
      return (getTotalHours(b) - getTotalHours(a)) * multiplier;
    } else {
      const multiplier = sorting.direction === 'desc' ? -1 : 1;
      return multiplier * (a.name.localeCompare(b.name));
    }
  });

  const toggleSort = (field: 'hours' | 'name') => {
    if (sorting.field === field) {
      onSortChange({
        field,
        direction: sorting.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      onSortChange({ field, direction: 'asc' });
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th 
              className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-2"
              onClick={() => toggleSort('name')}
            >
              Nome
              <ArrowUpDown className="h-4 w-4" />
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Custo Total</th>
            <th 
              className="px-4 py-3 text-right font-medium text-gray-500 cursor-pointer hover:text-gray-700 flex items-center justify-end gap-2"
              onClick={() => toggleSort('hours')}
            >
              Horas Totais
              <ArrowUpDown className="h-4 w-4" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUnits.map((unit) => {
            const upstreamHours = unit.demands_aggregate.aggregate.sum.effort_upstream || 0;
            const downstreamHours = unit.demands_aggregate.aggregate.sum.effort_downstream || 0;
            const totalHours = upstreamHours + downstreamHours;
            const totalCost = unit.demands_aggregate.aggregate.sum.cost_to_project || 0;
            
            return (
              <tr key={unit.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{unit.name}</td>
                <td className="px-4 py-3">
                  <Badge 
                    variant={portfolioUnitTypeMap[unit.portfolio_unit_type]?.variant || "secondary"}
                  >
                    {portfolioUnitTypeMap[unit.portfolio_unit_type]?.label || unit.portfolio_unit_type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-right">{totalCost > 0 ? `R$ ${totalCost.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-3 text-sm text-right">{totalHours > 0 ? totalHours.toFixed(2) : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
} 